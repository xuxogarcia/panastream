const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { s3, s3Config, cloudFrontConfig } = require('../config/aws');

// Constants for upload limits
const SINGLE_UPLOAD_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB - S3 single PUT limit
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks for multipart
const MULTIPART_PART_MIN = 5 * 1024 * 1024; // 5MB minimum (except last part)

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video and image files
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'), false);
    }
  }
});

// Create upload session
router.post('/session', async (req, res) => {
  const { filename, fileSize, contentType } = req.body;
  
  if (!filename || !fileSize) {
    return res.status(400).json({ error: 'Filename and file size are required' });
  }
  
  const sessionId = uuidv4();
  const s3Key = `${s3Config.uploadFolder}/${sessionId}/${filename}`;
  const fileSizeNum = parseInt(fileSize);
  const useMultipart = fileSizeNum >= SINGLE_UPLOAD_LIMIT;
  
  // Store session in database
  const query = `
    INSERT INTO upload_sessions (id, filename, file_size, s3_key, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [sessionId, filename, fileSizeNum, s3Key, 'PENDING'], async function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    try {
      if (useMultipart) {
        // Initialize multipart upload for large files
        const multipartParams = {
          Bucket: s3Config.bucket,
          Key: s3Key,
          ContentType: contentType || 'video/*'
        };
        
        const multipartData = await s3.createMultipartUpload(multipartParams).promise();
        const uploadId = multipartData.UploadId;
        
        // Calculate number of parts
        const numParts = Math.ceil(fileSizeNum / CHUNK_SIZE);
        
        // Store upload ID in database (we'll need to add this column)
        db.run(
          'UPDATE upload_sessions SET multipart_upload_id = ? WHERE id = ?',
          [uploadId, sessionId],
          (err) => {
            if (err) console.error('Error storing upload ID:', err);
          }
        );
        
        res.json({
          sessionId,
          s3Key,
          uploadId,
          useMultipart: true,
          chunkSize: CHUNK_SIZE,
          numParts,
          message: 'Multipart upload initialized'
        });
      } else {
        // Use direct PUT for small files
        const uploadUrl = generatePresignedUploadUrl(s3Key, fileSizeNum, contentType);
        res.json({
          sessionId,
          s3Key,
          uploadUrl,
          useMultipart: false,
          message: 'Direct upload URL generated'
        });
      }
    } catch (error) {
      console.error('Error initializing upload:', error);
      res.status(500).json({ error: 'Failed to initialize upload' });
    }
  });
});

// Get presigned URL for multipart upload part
router.post('/multipart/part-url', async (req, res) => {
  const { sessionId, partNumber } = req.body;
  
  if (!sessionId || !partNumber) {
    return res.status(400).json({ error: 'Session ID and part number are required' });
  }
  
  // Get upload session
  db.get('SELECT * FROM upload_sessions WHERE id = ?', [sessionId], async (err, session) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    // Get multipart upload ID from database
    db.get('SELECT multipart_upload_id FROM upload_sessions WHERE id = ?', [sessionId], async (err, row) => {
      if (err || !row || !row.multipart_upload_id) {
        return res.status(500).json({ error: 'Multipart upload not initialized' });
      }
      
      try {
        const params = {
          Bucket: s3Config.bucket,
          Key: session.s3_key,
          PartNumber: parseInt(partNumber),
          UploadId: row.multipart_upload_id
        };
        
        const url = await s3.getSignedUrlPromise('uploadPart', params);
        res.json({
          partNumber: parseInt(partNumber),
          uploadUrl: url
        });
      } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Failed to generate presigned URL' });
      }
    });
  });
});

// Complete multipart upload
router.post('/complete', async (req, res) => {
  const { sessionId, parts } = req.body; // parts is array of { PartNumber, ETag } for multipart
  
  db.get('SELECT * FROM upload_sessions WHERE id = ?', [sessionId], async (err, session) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    try {
      // Get multipart upload ID
      db.get('SELECT multipart_upload_id FROM upload_sessions WHERE id = ?', [sessionId], async (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const useMultipart = row && row.multipart_upload_id;
        
        if (useMultipart) {
          // Complete multipart upload
          if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ error: 'Parts array is required for multipart upload' });
          }
          
          const completeParams = {
            Bucket: s3Config.bucket,
            Key: session.s3_key,
            UploadId: row.multipart_upload_id,
            MultipartUpload: {
              Parts: parts.map(part => ({
                PartNumber: parseInt(part.PartNumber),
                ETag: part.ETag
              }))
            }
          };
          
          const completeData = await s3.completeMultipartUpload(completeParams).promise();
          
          // Update session status
          db.run(
            'UPDATE upload_sessions SET status = ?, uploaded_size = ? WHERE id = ?',
            ['COMPLETED', session.file_size, sessionId],
            (err) => {
              if (err) console.error('Error updating session:', err);
            }
          );
          
          res.json({
            success: true,
            s3Key: session.s3_key,
            cloudfrontUrl: cloudFrontConfig.domain ? `${cloudFrontConfig.domain}/${session.s3_key}` : null,
            location: completeData.Location,
            etag: completeData.ETag,
            message: 'Multipart upload completed successfully'
          });
        } else {
          // Direct upload - just update status
          db.run(
            'UPDATE upload_sessions SET status = ?, uploaded_size = ? WHERE id = ?',
            ['COMPLETED', session.file_size, sessionId],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.json({
                success: true,
                s3Key: session.s3_key,
                cloudfrontUrl: cloudFrontConfig.domain ? `${cloudFrontConfig.domain}/${session.s3_key}` : null,
                message: 'Upload completed successfully'
              });
            }
          );
        }
      });
    } catch (error) {
      console.error('Error completing upload:', error);
      
      // Try to abort multipart upload on error
      db.get('SELECT multipart_upload_id FROM upload_sessions WHERE id = ?', [sessionId], async (err, row) => {
        if (row && row.multipart_upload_id) {
          try {
            await s3.abortMultipartUpload({
              Bucket: s3Config.bucket,
              Key: session.s3_key,
              UploadId: row.multipart_upload_id
            }).promise();
          } catch (abortError) {
            console.error('Error aborting multipart upload:', abortError);
          }
        }
      });
      
      res.status(500).json({ error: 'Failed to complete upload' });
    }
  });
});

// Get upload progress
router.get('/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  db.get('SELECT * FROM upload_sessions WHERE id = ?', [sessionId], (err, session) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    const progress = (session.uploaded_size / session.file_size) * 100;
    
    res.json({
      sessionId,
      progress,
      status: session.status,
      uploadedSize: session.uploaded_size,
      totalSize: session.file_size
    });
  });
});

// Generate presigned URL for direct S3 upload
function generatePresignedUploadUrl(s3Key, fileSize, contentType = 'video/*') {
  // Calculate expiration based on file size (1 hour per 5GB, minimum 1 hour)
  const hours = Math.max(1, Math.ceil(fileSize / (5 * 1024 * 1024 * 1024)));
  const expires = hours * 3600;
  
  const params = {
    Bucket: s3Config.bucket,
    Key: s3Key,
    Expires: expires,
    ContentType: contentType
  };
  
  return s3.getSignedUrl('putObject', params);
}

module.exports = router;
