const db = require('./database');

// Migration to add filmmaker/microsite support
db.serialize(() => {
  // Create filmmakers table
  db.run(`
    CREATE TABLE IF NOT EXISTS filmmakers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create microsites table
  db.run(`
    CREATE TABLE IF NOT EXISTS microsites (
      id TEXT PRIMARY KEY,
      filmmaker_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      hero_image_url TEXT,
      description TEXT,
      custom_domain TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (filmmaker_id) REFERENCES filmmakers (id)
    )
  `);

  // Add filmmaker_id to media table (migration)
  db.run(`
    ALTER TABLE media 
    ADD COLUMN filmmaker_id TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding filmmaker_id column:', err);
    }
  });

  // Add index for filmmaker_id
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_media_filmmaker 
    ON media(filmmaker_id)
  `);

  console.log('Database migration completed: Filmmaker/Microsite support added');
});

module.exports = db;

