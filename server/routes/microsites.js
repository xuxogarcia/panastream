const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all microsites (for admin)
router.get('/', (req, res) => {
  const query = `
    SELECT m.*, f.name as filmmaker_name, f.email as filmmaker_email
    FROM microsites m
    JOIN filmmakers f ON m.filmmaker_id = f.id
    ORDER BY m.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get microsite by slug (public)
router.get('/slug/:slug', (req, res) => {
  const { slug } = req.params;
  
  const query = `
    SELECT m.*, f.name as filmmaker_name
    FROM microsites m
    JOIN filmmakers f ON m.filmmaker_id = f.id
    WHERE m.slug = ? AND (m.is_active = 1 OR m.is_active IS NULL)
  `;
  
  db.get(query, [slug], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Microsite not found' });
    }
    
    res.json(row);
  });
});

// Get microsite by filmmaker ID
router.get('/filmmaker/:filmmakerId', (req, res) => {
  const { filmmakerId } = req.params;
  
  const query = 'SELECT * FROM microsites WHERE filmmaker_id = ?';
  
  db.get(query, [filmmakerId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Microsite not found' });
    }
    
    res.json(row);
  });
});

// Create microsite
router.post('/', (req, res) => {
  const {
    filmmaker_id,
    name,
    slug,
    logo_url,
    hero_image_url,
    description,
    about_text,
    custom_domain,
    primary_color,
    background_color,
    text_color,
    accent_color,
    font_family,
    twitter_url,
    instagram_url,
    facebook_url,
    youtube_url,
    tiktok_url,
    linkedin_url,
    imdb_url
  } = req.body;
  
  if (!filmmaker_id || !name || !slug) {
    return res.status(400).json({ error: 'filmmaker_id, name, and slug are required' });
  }
  
  const id = uuidv4();
  
  const query = `
    INSERT INTO microsites (
      id, filmmaker_id, name, slug, logo_url, 
      hero_image_url, description, about_text, custom_domain,
      primary_color, background_color, text_color, accent_color, font_family,
      twitter_url, instagram_url, facebook_url, youtube_url, tiktok_url, linkedin_url, imdb_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    id, filmmaker_id, name, slug, logo_url,
    hero_image_url, description, about_text || null, custom_domain,
    primary_color || '#000000', background_color || '#ffffff',
    text_color || '#333333', accent_color || '#666666',
    font_family || 'Inter, sans-serif',
    twitter_url || null, instagram_url || null, facebook_url || null,
    youtube_url || null, tiktok_url || null, linkedin_url || null, imdb_url || null
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Slug already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      id,
      message: 'Microsite created successfully'
    });
  });
});

// Update microsite
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    logo_url,
    hero_image_url,
    description,
    about_text,
    custom_domain,
    primary_color,
    background_color,
    text_color,
    accent_color,
    font_family,
    twitter_url,
    instagram_url,
    facebook_url,
    youtube_url,
    tiktok_url,
    linkedin_url,
    imdb_url,
    is_active
  } = req.body;
  
  const query = `
    UPDATE microsites 
    SET name = ?, logo_url = ?, hero_image_url = ?, 
        description = ?, about_text = ?, custom_domain = ?,
        primary_color = ?, background_color = ?, text_color = ?,
        accent_color = ?, font_family = ?,
        twitter_url = ?, instagram_url = ?, facebook_url = ?,
        youtube_url = ?, tiktok_url = ?, linkedin_url = ?, imdb_url = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [
    name, logo_url, hero_image_url,
    description, about_text || null, custom_domain,
    primary_color || '#000000', background_color || '#ffffff',
    text_color || '#333333', accent_color || '#666666',
    font_family || 'Inter, sans-serif',
    twitter_url || null, instagram_url || null, facebook_url || null,
    youtube_url || null, tiktok_url || null, linkedin_url || null, imdb_url || null,
    is_active, id
  ], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Microsite not found' });
    }
    
    res.json({ message: 'Microsite updated successfully' });
  });
});

// Delete microsite
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM microsites WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Microsite not found' });
    }
    
    res.json({ message: 'Microsite deleted successfully' });
  });
});

module.exports = router;

