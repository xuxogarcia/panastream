const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Create filmmaker (register)
router.post('/', async (req, res) => {
  const { name, email, password, slug } = req.body;
  
  if (!name || !email || !slug) {
    return res.status(400).json({ error: 'Name, email, and slug are required' });
  }
  
  const id = uuidv4();
  let password_hash = null;
  
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }
  
  const query = `
    INSERT INTO filmmakers (id, name, email, password_hash, slug)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [id, name, email, password_hash, slug], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Email or slug already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      id,
      name,
      email,
      slug,
      message: 'Filmmaker created successfully'
    });
  });
});

// List all filmmakers (for directory) - MUST come before /:id route
router.get('/', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  db.all(
    'SELECT id, name, slug, created_at FROM filmmakers ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get total count
      db.get('SELECT COUNT(*) as total FROM filmmakers', (err, countRow) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
          filmmakers: rows,
          total: countRow.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      });
    }
  );
});

// Get filmmaker by slug
router.get('/slug/:slug', (req, res) => {
  const { slug } = req.params;
  
  db.get('SELECT id, name, email, slug, created_at FROM filmmakers WHERE slug = ?', [slug], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Filmmaker not found' });
    }
    
    res.json(row);
  });
});

// Get filmmaker by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, name, email, slug, created_at FROM filmmakers WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Filmmaker not found' });
    }
    
    res.json(row);
  });
});

// Update filmmaker
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, slug } = req.body;
  
  let query = 'UPDATE filmmakers SET updated_at = CURRENT_TIMESTAMP';
  const params = [];
  
  if (name) {
    query += ', name = ?';
    params.push(name);
  }
  
  if (email) {
    query += ', email = ?';
    params.push(email);
  }
  
  if (slug) {
    query += ', slug = ?';
    params.push(slug);
  }
  
  if (password) {
    const password_hash = await bcrypt.hash(password, 10);
    query += ', password_hash = ?';
    params.push(password_hash);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Filmmaker not found' });
    }
    
    res.json({ message: 'Filmmaker updated successfully' });
  });
});

// Delete filmmaker by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // First, delete associated microsite if it exists
  db.run('DELETE FROM microsites WHERE filmmaker_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting microsite:', err);
      // Continue even if microsite deletion fails
    }
    
    // Delete associated media
    db.run('DELETE FROM media WHERE filmmaker_id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting media:', err);
        // Continue even if media deletion fails
      }
      
      // Finally, delete the filmmaker
      db.run('DELETE FROM filmmakers WHERE id = ?', [id], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Filmmaker not found' });
        }
        
        res.json({ message: 'Filmmaker deleted successfully' });
      });
    });
  });
});

// Login filmmaker
router.post('/login', async (req, res) => {
  const { emailOrSlug, password } = req.body;
  
  if (!emailOrSlug || !password) {
    return res.status(400).json({ error: 'Email/slug and password are required' });
  }
  
  // Try to find by email or slug
  const query = 'SELECT * FROM filmmakers WHERE email = ? OR slug = ?';
  
  db.get(query, [emailOrSlug, emailOrSlug], async (err, filmmaker) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!filmmaker) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!filmmaker.password_hash) {
      return res.status(401).json({ error: 'No password set for this account' });
    }
    
    const validPassword = await bcrypt.compare(password, filmmaker.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return filmmaker info (excluding password hash)
    res.json({
      filmmaker: {
        id: filmmaker.id,
        name: filmmaker.name,
        email: filmmaker.email,
        slug: filmmaker.slug,
        created_at: filmmaker.created_at
      },
      message: 'Login successful'
    });
  });
});

module.exports = router;

