const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { mediaConvert, mediaConvertConfig, s3Config, cloudFrontConfig } = require('../config/aws');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const rateLimit = require('express-rate-limit');

// More permissive rate limiting for conversions (polling needs frequent requests)
const conversionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 60 : 300, // 300 requests per minute in dev, 60 in production
  message: {
    error: 'Too many conversion requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Function to find FFmpeg executable
function findFFmpegPath() {
  const { execSync } = require('child_process');
  const possiblePaths = [
    '/snap/bin/ffmpeg', // Local snap installation
    '/usr/bin/ffmpeg',  // System installation
    'ffmpeg'            // In PATH
  ];
  
  for (const ffmpegPath of possiblePaths) {
    try {
      if (ffmpegPath === 'ffmpeg') {
        // Check if ffmpeg is in PATH
        execSync('which ffmpeg', { stdio: 'ignore' });
        return 'ffmpeg';
      } else if (fs.existsSync(ffmpegPath)) {
        return ffmpegPath;
      }
    } catch (e) {
      // Path doesn't exist or not in PATH, try next
      continue;
    }
  }
  
  // Default to 'ffmpeg' (assume it's in PATH)
  return 'ffmpeg';
}

// Function to generate thumbnail using FFmpeg
async function generateThumbnail(videoUrl, outputPath) {
  return new Promise((resolve, reject) => {
    // Find FFmpeg path dynamically
    const ffmpegPath = findFFmpegPath();
    const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
    
    console.log(`Using FFmpeg path: ${ffmpegPath}`);
    
    // Configure FFmpeg paths
    if (ffmpegPath !== 'ffmpeg') {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath !== 'ffprobe' && fs.existsSync(ffprobePath)) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
    
    const outputDir = path.dirname(outputPath);
    const baseName = path.basename(outputPath, '.jpg');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Generating thumbnail from ${videoUrl} to ${outputPath}...`);
    
    ffmpeg(videoUrl)
      .screenshots({
        timestamps: ['10%'], // Take screenshot at 10% of video duration
        filename: `${baseName}.jpg`,
        folder: outputDir,
        size: '320x180'
      })
      .on('end', () => {
        console.log('Thumbnail generated successfully');
        // FFmpeg might add a timestamp, so let's find the actual file
        const actualPath = path.join(outputDir, `${baseName}.0000001.jpg`);
        if (fs.existsSync(actualPath)) {
          // Rename to expected filename
          fs.renameSync(actualPath, outputPath);
        }
        // Verify file was created
        if (fs.existsSync(outputPath)) {
          console.log(`✅ Thumbnail file created: ${outputPath}`);
          resolve(outputPath);
        } else {
          reject(new Error(`Thumbnail file not found after generation: ${outputPath}`));
        }
      })
      .on('error', (err) => {
        console.error('Error generating thumbnail:', err);
        console.error('FFmpeg path used:', ffmpegPath);
        reject(err);
      });
  });
}

// Function to upload thumbnail to S3
async function uploadThumbnailToS3(localPath, s3Key) {
  const fileContent = fs.readFileSync(localPath);
  
  const params = {
    Bucket: s3Config.bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'image/jpeg'
  };
  
  return s3.upload(params).promise();
}

// Async function to generate thumbnail locally (MVP approach)
async function generateThumbnailAsync(videoUrl, mediaId, baseFilename, outputS3Key) {
  try {
    // Create local thumbnails directory
    const thumbnailsDir = path.join(__dirname, '../public/thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    
    const localThumbnailPath = path.join(thumbnailsDir, `${mediaId}.jpg`);
    
    console.log(`Generating thumbnail for ${mediaId}...`);
    
    // Generate thumbnail
    await generateThumbnail(videoUrl, localThumbnailPath);
    
    // Update media record with local thumbnail URL
    const thumbnailUrl = `/thumbnails/${mediaId}.jpg`;
    
    db.run('UPDATE media SET thumbnail_path = ? WHERE id = ?', [thumbnailUrl, mediaId], function(err) {
      if (err) {
        console.error('Error updating thumbnail URL:', err);
      } else {
        console.log(`Updated media record ${mediaId} with local thumbnail: ${thumbnailUrl}`);
      }
    });
    
  } catch (error) {
    console.error('Error generating thumbnail:', error);
  }
}

// Create conversion jobs from uploaded files
router.post('/create', async (req, res) => {
  const { files, metadata, mediaIds } = req.body; // mediaIds is optional - if provided, use existing media entries
  
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Files array is required' });
  }
  
  if (!metadata || !metadata.title) {
    return res.status(400).json({ error: 'Metadata with title is required' });
  }
  
  try {
    const jobIds = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let mediaId;
      
      // If mediaIds array is provided and has an entry for this file, use that media ID
      if (mediaIds && Array.isArray(mediaIds) && mediaIds[i]) {
        const existingMediaId = mediaIds[i];
        
        // Verify the media entry exists synchronously
        const mediaExists = await new Promise((resolve) => {
          db.get('SELECT id FROM media WHERE id = ?', [existingMediaId], (err, row) => {
            resolve(!err && row);
          });
        });
        
        if (mediaExists) {
          mediaId = existingMediaId;
          console.log(`Using existing media entry: ${mediaId} for file ${file.name}`);
        } else {
          console.error(`Media entry ${existingMediaId} not found, will create new one`);
        }
      }
      
      // Create new media entry only if one doesn't exist
      if (!mediaId) {
        mediaId = uuidv4();
        const jobId = uuidv4();
        
        // Insert media record (without filmmaker_id - should be set via /api/media endpoint)
        db.run(
          `INSERT INTO media (id, title, description, genre, year, filename, file_size, duration, status, mime_type, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mediaId,
            metadata.title,
            metadata.description || '',
            metadata.genre || '',
            metadata.year || new Date().getFullYear(),
            file.name,
            file.size,
            0, // Duration will be updated after conversion
            'processing',
            file.type || 'video/mp4', // MIME type
            new Date().toISOString()
          ],
          function(err) {
            if (err) {
              console.error('Error inserting media record:', err.message);
              return;
            }
          }
        );
      }
      
      const jobId = uuidv4();
      
      // Use the S3 key from the uploaded file
      const inputS3Key = file.s3Key;
      const outputS3Key = `${s3Config.processedFolder}/${mediaId}/${jobId}`;

      if (!inputS3Key) {
        throw new Error(`No S3 key provided for file: ${file.name}`);
      }

      console.log(`Using S3 key for file ${file.name}: ${inputS3Key}`);

          // Create actual MediaConvert job
          try {
            const jobParams = {
              Role: mediaConvertConfig.roleArn,
              Settings: {
                Inputs: [{
                  FileInput: `s3://${s3Config.bucket}/${inputS3Key}`,
                  AudioSelectors: {
                    "Audio Selector 1": {
                      DefaultSelection: "DEFAULT"
                    }
                  },
                  VideoSelector: {
                    ColorSpace: "FOLLOW"
                  }
                }],
                OutputGroups: [{
                  Name: "File Group",
                  OutputGroupSettings: {
                    Type: "FILE_GROUP_SETTINGS",
                    FileGroupSettings: {
                      Destination: `s3://${s3Config.bucket}/${outputS3Key}/`
                    }
                  },
                  Outputs: [{
                    NameModifier: "_4k",
                    VideoDescription: {
                      Width: 3840,
                      Height: 2160,
                      CodecSettings: {
                        Codec: "H_264",
                        H264Settings: {
                          RateControlMode: "QVBR",
                          QvbrSettings: {
                            QvbrQualityLevel: 9
                          },
                          MaxBitrate: 25000000,
                          FramerateControl: "INITIALIZE_FROM_SOURCE",
                          FramerateNumerator: 30,
                          FramerateDenominator: 1
                        }
                      }
                    },
                    AudioDescriptions: [{
                      CodecSettings: {
                        Codec: "AAC",
                        AacSettings: {
                          Bitrate: 128000,
                          CodingMode: "CODING_MODE_2_0",
                          SampleRate: 48000
                        }
                      }
                    }],
                    ContainerSettings: {
                      Container: "MP4",
                      Mp4Settings: {
                        CslgAtom: "INCLUDE",
                        FreeSpaceBox: "EXCLUDE",
                        MoovPlacement: "PROGRESSIVE_DOWNLOAD"
                      }
                    }
                  }]
                }]
              }
            };

        // Create the MediaConvert job
        const result = await mediaConvert.createJob(jobParams).promise();
        const awsJobId = result.Job.Id;

        // Insert conversion job record with real AWS job ID
        db.run(
          `INSERT INTO conversions (jobId, mediaId, inputS3Key, outputS3Key, status, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            awsJobId,
            mediaId,
            inputS3Key,
            outputS3Key,
            'SUBMITTED',
            new Date().toISOString()
          ],
          function(err) {
            if (err) {
              console.error('Error inserting conversion job:', err.message);
              return;
            }
          }
        );

        jobIds.push(awsJobId);
        console.log(`Created MediaConvert job: ${awsJobId} for file: ${file.name}`);

      } catch (mediaConvertError) {
        console.error('MediaConvert error:', mediaConvertError);
        
        // Insert conversion job record with error status
        db.run(
          `INSERT INTO conversions (jobId, mediaId, inputS3Key, outputS3Key, status, errorMessage, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            jobId,
            mediaId,
            inputS3Key,
            outputS3Key,
            'ERROR',
            mediaConvertError.message,
            new Date().toISOString()
          ],
          function(err) {
            if (err) {
              console.error('Error inserting conversion job:', err.message);
              return;
            }
          }
        );

        jobIds.push(jobId);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Conversion jobs created successfully',
      jobIds,
      count: jobIds.length
    });
    
  } catch (error) {
    console.error('Error creating conversion jobs:', error);
    res.status(500).json({ error: 'Failed to create conversion jobs' });
  }
});

// Start MediaConvert job
router.post('/start', async (req, res) => {
  const { mediaId, inputS3Key } = req.body;
  
  if (!mediaId || !inputS3Key) {
    return res.status(400).json({ error: 'Media ID and input S3 key are required' });
  }
  
  try {
    const jobId = uuidv4();
    const outputS3Key = `${s3Config.processedFolder}/${mediaId}/${jobId}`;
    
    // Create MediaConvert job
    const jobParams = {
      Role: mediaConvertConfig.roleArn,
      Settings: {
        Inputs: [{
          FileInput: `s3://${s3Config.bucket}/${inputS3Key}`,
          AudioSelectors: {
            "Audio Selector 1": {
              DefaultSelection: "DEFAULT"
            }
          },
          VideoSelector: {
            ColorSpace: "FOLLOW"
          }
        }],
        OutputGroups: [{
          Name: "File Group",
          OutputGroupSettings: {
            Type: "FILE_GROUP_SETTINGS",
            FileGroupSettings: {
              Destination: `s3://${s3Config.bucket}/${outputS3Key}/`
            }
          },
          Outputs: [{
            NameModifier: "_4k",
            VideoDescription: {
              Width: 3840,
              Height: 2160,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  RateControlMode: "QVBR",
                  QvbrSettings: {
                    QvbrQualityLevel: 9
                  },
                  MaxBitrate: 25000000,
                  FramerateControl: "INITIALIZE_FROM_SOURCE",
                  FramerateNumerator: 30,
                  FramerateDenominator: 1,
                  ResolutionAdaptive: "DISABLED"
                }
              },
              AudioDescriptions: [{
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: {
                    Bitrate: 128000,
                    CodingMode: "CODING_MODE_2_0",
                    SampleRate: 48000
                  }
                }
              }]
            },
            ContainerSettings: {
              Container: "MP4",
              Mp4Settings: {
                CslgAtom: "INCLUDE",
                FreeSpaceBox: "EXCLUDE",
                MoovPlacement: "PROGRESSIVE_DOWNLOAD"
              }
            }
          }]
        }]
      }
    };
    
    const result = await mediaConvert.createJob(jobParams).promise();
    
    // Store job in database using conversions table
    const query = `
      INSERT INTO conversions (jobId, mediaId, inputS3Key, outputS3Key, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
      result.Job.Id,
      mediaId,
      inputS3Key,
      outputS3Key,
      'SUBMITTED',
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        jobId: result.Job.Id,
        status: result.Job.Status,
        message: 'Conversion job started successfully'
      });
    });
    
  } catch (error) {
    console.error('MediaConvert error:', error);
    res.status(500).json({ error: 'Failed to start conversion job' });
  }
});

// Get job status
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  db.get('SELECT * FROM conversions WHERE jobId = ?', [jobId], (err, row) => {
    if (err) {
      console.error('Database error in /status/:jobId:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Job not found', jobId });
    }
    
    // Get updated status from MediaConvert
    mediaConvert.getJob({ Id: jobId }, (err, data) => {
      if (err) {
        console.error('MediaConvert get job error:', err);
        return res.json({
          jobId: row.jobId,
          status: row.status,
          mediaId: row.mediaId,
          inputS3Key: row.inputS3Key,
          outputS3Key: row.outputS3Key,
          errorMessage: row.errorMessage,
          createdAt: row.createdAt,
          completedAt: row.completedAt
        });
      }
      
      // Update database with current status
      const updateQuery = `
        UPDATE conversions 
        SET status = ?, errorMessage = ?, completedAt = ?
        WHERE jobId = ?
      `;
      
      const completedAt = (data.Job.Status === 'COMPLETE' || data.Job.Status === 'ERROR') 
        ? new Date().toISOString() 
        : null;
      
      db.run(updateQuery, [
        data.Job.Status,
        data.Job.ErrorMessage || null,
        completedAt,
        jobId
      ], (err) => {
        if (err) {
          console.error('Error updating conversion status:', err);
        }
      });

      // If job is complete, update the media record with processed video info
      if (data.Job.Status === 'COMPLETE') {
        // Get the original filename from the media record
        db.get('SELECT filename FROM media WHERE id = ?', [row.mediaId], (err, media) => {
          if (err) {
            console.error('Error getting media record:', err);
          } else if (media) {
            // Extract base filename without extension
            const baseFilename = media.filename.replace(/\.[^/.]+$/, "");
            
            // Update media record with processed video info
            const processedS3Key = `${row.outputS3Key}/${baseFilename}_4k.mp4`; // MediaConvert output filename
            
            // Use CloudFront URL for video
            // Handle case where CloudFront domain might not be set (use existing cloudfront_url pattern)
            let cloudfrontUrl;
            if (cloudFrontConfig.domain) {
              cloudfrontUrl = `https://${cloudFrontConfig.domain}/${processedS3Key}`;
            } else {
              // Fallback: use CLOUDFRONT_DOMAIN from env or placeholder
              cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN || 'your-cloudfront-domain.cloudfront.net'}/${processedS3Key}`;
            }
            
            // Update the media record with video info (preserve filmmaker_id if it exists)
            const updateMediaQuery = `
              UPDATE media 
              SET s3_key = ?, 
                  cloudfront_url = ?,
                  status = 'ready',
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            db.run(updateMediaQuery, [processedS3Key, cloudfrontUrl, row.mediaId], function(err) {
              if (err) {
                console.error('Error updating media record:', err);
              } else {
                console.log(`✅ Updated media record ${row.mediaId} with processed video: ${cloudfrontUrl}`);
                
                // Check if filmmaker_id is missing and try to get it from conversion context
                // (This is a fallback - filmmaker_id should be set on creation)
                db.get('SELECT filmmaker_id FROM media WHERE id = ?', [row.mediaId], (err, mediaRow) => {
                  if (!err && mediaRow && !mediaRow.filmmaker_id) {
                    console.warn(`⚠️ Media ${row.mediaId} has no filmmaker_id - media may not appear in filtered queries`);
                  }
                });
                
                // Generate thumbnail asynchronously
                generateThumbnailAsync(cloudfrontUrl, row.mediaId, baseFilename, row.outputS3Key);
              }
            });
          }
        });
      }
      
      res.json({
        jobId: data.Job.Id,
        status: data.Job.Status,
        mediaId: row.mediaId,
        inputS3Key: row.inputS3Key,
        outputS3Key: row.outputS3Key,
        errorMessage: data.Job.ErrorMessage,
        createdAt: row.createdAt,
        completedAt: completedAt || row.completedAt
      });
    });
  });
});

// List all conversion jobs
router.get('/jobs', conversionLimiter, (req, res) => {
  const { status, mediaId } = req.query;
  
  let query = `
    SELECT c.*, m.title as mediaTitle, m.filename, m.description, m.genre, m.year
    FROM conversions c 
    LEFT JOIN media m ON c.mediaId = m.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  
  if (mediaId) {
    query += ' AND c.mediaId = ?';
    params.push(mediaId);
  }
  
  query += ' ORDER BY c.createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

// Poll MediaConvert job status
router.post('/poll-status', conversionLimiter, async (req, res) => {
  const { jobIds } = req.body;
  
  if (!jobIds || !Array.isArray(jobIds)) {
    return res.status(400).json({ error: 'Job IDs array is required' });
  }

  try {
    const statusUpdates = [];
    
    for (const jobId of jobIds) {
      try {
        // Get job status from AWS MediaConvert
        const jobResult = await mediaConvert.getJob({ Id: jobId }).promise();
        const job = jobResult.Job;
        
        // Update database with current status
        const updateQuery = `
          UPDATE conversions 
          SET status = ?, 
              errorMessage = ?,
              completedAt = ?
          WHERE jobId = ?
        `;
        
        const errorMessage = job.Status === 'ERROR' ? job.ErrorMessage : null;
        const completedAt = (job.Status === 'COMPLETE' || job.Status === 'ERROR') 
          ? new Date().toISOString() 
          : null;
        
        db.run(updateQuery, [job.Status, errorMessage, completedAt, jobId], function(err) {
          if (err) {
            console.error('Error updating job status:', err);
          }
        });

        // If job is complete, update the media record with processed video info
        if (job.Status === 'COMPLETE') {
          // Get the conversion record to get mediaId and outputS3Key
          db.get('SELECT mediaId, outputS3Key FROM conversions WHERE jobId = ?', [jobId], (err, conversion) => {
            if (err) {
              console.error('Error getting conversion record:', err);
              return;
            }
            
            if (conversion) {
              // Get the original filename from the media record
              db.get('SELECT filename FROM media WHERE id = ?', [conversion.mediaId], (err, media) => {
                if (err) {
                  console.error('Error getting media record:', err);
                  return;
                }
                
                if (media) {
                  // Extract base filename without extension
                  const baseFilename = media.filename.replace(/\.[^/.]+$/, "");
                  
                  // Update media record with processed video info
                  const processedS3Key = `${conversion.outputS3Key}/${baseFilename}_4k.mp4`; // MediaConvert output filename
                  
                  // Use CloudFront URL for video
                  // Handle case where CloudFront domain might not be set
                  let cloudfrontUrl;
                  if (cloudFrontConfig.domain) {
                    cloudfrontUrl = `https://${cloudFrontConfig.domain}/${processedS3Key}`;
                  } else {
                    // Fallback: use CLOUDFRONT_DOMAIN from env or placeholder
                    cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN || 'your-cloudfront-domain.cloudfront.net'}/${processedS3Key}`;
                  }
                  
                  // First update the media record with video info
                  const updateMediaQuery = `
                    UPDATE media 
                    SET s3_key = ?, 
                        cloudfront_url = ?,
                        status = 'ready',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `;
                  
                  db.run(updateMediaQuery, [processedS3Key, cloudfrontUrl, conversion.mediaId], function(err) {
                    if (err) {
                      console.error('Error updating media record:', err);
                    } else {
                      console.log(`Updated media record ${conversion.mediaId} with processed video: ${cloudfrontUrl}`);
                      
                      // Now generate thumbnail asynchronously
                      generateThumbnailAsync(cloudfrontUrl, conversion.mediaId, baseFilename, conversion.outputS3Key);
                    }
                  });
                }
              });
            }
          });
        }
        
        // Calculate progress based on job status
        let progress = 0;
        switch (job.Status) {
          case 'SUBMITTED':
            progress = 10;
            break;
          case 'PROGRESSING':
            progress = 50;
            break;
          case 'COMPLETE':
            progress = 100;
            break;
          case 'ERROR':
          case 'CANCELED':
            progress = 0;
            break;
          default:
            progress = 10;
        }
        
        statusUpdates.push({
          jobId,
          status: job.Status,
          progress,
          errorMessage: job.ErrorMessage || null,
          completedAt
        });
        
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        statusUpdates.push({
          jobId,
          status: 'ERROR',
          progress: 0,
          errorMessage: error.message,
          completedAt: null
        });
      }
    }
    
    res.json({ statusUpdates });
    
  } catch (error) {
    console.error('Error polling job statuses:', error);
    res.status(500).json({ error: 'Failed to poll job statuses' });
  }
});

// Manually trigger thumbnail generation for a media item
router.post('/generate-thumbnail/:mediaId', async (req, res) => {
  const { mediaId } = req.params;
  
  try {
    // Get media record
    db.get('SELECT id, cloudfront_url, filename, s3_key FROM media WHERE id = ?', [mediaId], async (err, media) => {
      if (err) {
        console.error('Error getting media record:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (!media) {
        return res.status(404).json({ error: 'Media not found', mediaId });
      }
      
      if (!media.cloudfront_url) {
        return res.status(400).json({ error: 'Media has no cloudfront_url - conversion may not be complete' });
      }
      
      // Extract base filename and outputS3Key from s3_key
      const baseFilename = media.filename ? media.filename.replace(/\.[^/.]+$/, "") : mediaId;
      const outputS3Key = media.s3_key ? media.s3_key.split('/').slice(0, -1).join('/') : '';
      
      console.log(`Manually triggering thumbnail generation for ${mediaId}...`);
      
      // Generate thumbnail
      try {
        await generateThumbnailAsync(media.cloudfront_url, mediaId, baseFilename, outputS3Key);
        res.json({ 
          success: true, 
          message: 'Thumbnail generation triggered',
          mediaId: mediaId
        });
      } catch (thumbErr) {
        console.error('Error generating thumbnail:', thumbErr);
        res.status(500).json({ 
          error: 'Thumbnail generation failed', 
          details: thumbErr.message 
        });
      }
    });
  } catch (error) {
    console.error('Error in generate-thumbnail endpoint:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Cancel job
router.post('/cancel/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  mediaConvert.cancelJob({ Id: jobId }, (err, data) => {
    if (err) {
      console.error('MediaConvert cancel job error:', err);
      return res.status(500).json({ error: 'Failed to cancel job' });
    }
    
    // Update database
    const updateQuery = `
      UPDATE conversions 
      SET status = 'CANCELED', completedAt = ?
      WHERE jobId = ?
    `;
    
    db.run(updateQuery, [new Date().toISOString(), jobId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        jobId,
        status: 'CANCELED',
        message: 'Job canceled successfully'
      });
    });
  });
});

module.exports = router;
