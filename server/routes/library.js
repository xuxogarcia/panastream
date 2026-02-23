const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get library statistics
router.get('/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_media FROM media',
    'SELECT COUNT(*) as total_genres FROM (SELECT DISTINCT genre FROM media WHERE genre IS NOT NULL)',
    'SELECT SUM(file_size) as total_size FROM media',
    'SELECT COUNT(*) as total_jobs FROM conversions',
    'SELECT COUNT(*) as completed_jobs FROM conversions WHERE status = "COMPLETE"'
  ];
  
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  )).then(results => {
    const [totalMedia, totalGenres, totalSize, totalJobs, completedJobs] = results;
    
    res.json({
      totalMedia: totalMedia.total_media,
      totalGenres: totalGenres.total_genres,
      totalSize: totalSize.total_size || 0,
      totalJobs: totalJobs.total_jobs,
      completedJobs: completedJobs.completed_jobs
    });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Get genres
router.get('/genres', (req, res) => {
  const query = `
    SELECT genre, COUNT(*) as count 
    FROM media 
    WHERE genre IS NOT NULL 
    GROUP BY genre 
    ORDER BY count DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

// Get years
router.get('/years', (req, res) => {
  const query = `
    SELECT year, COUNT(*) as count 
    FROM media 
    WHERE year IS NOT NULL 
    GROUP BY year 
    ORDER BY year DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

// Get recent additions
router.get('/recent', (req, res) => {
  const { limit = 10 } = req.query;
  
  const query = `
    SELECT id, title, thumbnail_path, created_at 
    FROM media 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

// Search library
router.get('/search', (req, res) => {
  const { q, genre, year, limit = 20, offset = 0 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  let query = `
    SELECT * FROM media 
    WHERE (title LIKE ? OR description LIKE ?)
  `;
  const params = [`%${q}%`, `%${q}%`];
  
  if (genre) {
    query += ' AND genre = ?';
    params.push(genre);
  }
  
  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }
  
  query += ' ORDER BY title LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

module.exports = router;
