const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { s3, s3Config, cloudFrontConfig } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

// Get all media items
router.get('/', (req, res) => {
  const { page = 1, limit = 20, genre, year, search, filmmaker_id } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM media WHERE 1=1';
  const params = [];
  
  if (filmmaker_id) {
    query += ' AND filmmaker_id = ?';
    params.push(filmmaker_id);
  }
  
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (genre) {
    query += ' AND genre = ?';
    params.push(genre);
  }
  
  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE 1=1';
    const countParams = [];
    
    if (filmmaker_id) {
      countQuery += ' AND filmmaker_id = ?';
      countParams.push(filmmaker_id);
    }
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (genre) {
      countQuery += ' AND genre = ?';
      countParams.push(genre);
    }
    
    if (year) {
      countQuery += ' AND year = ?';
      countParams.push(year);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countRow.total,
          pages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// Get media item by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM media WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json(row);
  });
});

// Create new media item
router.post('/', (req, res) => {
  const {
    title,
    description,
    genre,
    year,
    duration,
    file_path,
    thumbnail_path,
    s3_key,
    file_size,
    mime_type,
    filmmaker_id
  } = req.body;
  
  const id = uuidv4();
  // Only set cloudfront_url if s3_key exists (will be set after conversion)
  const cloudfront_url = s3_key ? `${cloudFrontConfig.domain}/${s3_key}` : null;
  
  const query = `
    INSERT INTO media (
      id, title, description, genre, year, duration,
      filename, thumbnail_path, s3_key, cloudfront_url,
      file_size, mime_type, filmmaker_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id, title, description, genre, year, duration,
    file_path, thumbnail_path || null, s3_key, cloudfront_url,
    file_size, mime_type, filmmaker_id || null
  ];
  
  console.log('Creating media with filmmaker_id:', filmmaker_id);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      id,
      message: 'Media item created successfully'
    });
  });
});

// Update media item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    genre,
    year,
    duration,
    thumbnail_path
  } = req.body;
  
  const query = `
    UPDATE media 
    SET title = ?, description = ?, genre = ?, year = ?, 
        duration = ?, thumbnail_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const params = [title, description, genre, year, duration, thumbnail_path, id];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json({ message: 'Media item updated successfully' });
  });
});

// Delete media item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the media item to get S3 key
  db.get('SELECT s3_key FROM media WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    // Delete from S3
    const deleteParams = {
      Bucket: s3Config.bucket,
      Key: row.s3_key
    };
    
    s3.deleteObject(deleteParams, (err) => {
      if (err) {
        console.error('S3 delete error:', err);
        // Continue with database deletion even if S3 deletion fails
      }
      
      // Delete from database
      db.run('DELETE FROM media WHERE id = ?', [id], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ message: 'Media item deleted successfully' });
      });
    });
  });
});

// Get streaming URL for media
router.get('/:id/stream', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT cloudfront_url, s3_key FROM media WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json({
      stream_url: row.cloudfront_url,
      s3_key: row.s3_key
    });
  });
});

module.exports = router;
