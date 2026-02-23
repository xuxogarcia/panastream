const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Media table
  db.run(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      year INTEGER,
      duration INTEGER,
      filename TEXT,
      file_size INTEGER,
      status TEXT DEFAULT 'processing',
      s3_key TEXT,
      cloudfront_url TEXT,
      thumbnail_path TEXT,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Conversions table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId TEXT UNIQUE NOT NULL,
      mediaId TEXT NOT NULL,
      inputS3Key TEXT NOT NULL,
      outputS3Key TEXT,
      status TEXT DEFAULT 'SUBMITTED',
      errorMessage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      FOREIGN KEY (mediaId) REFERENCES media (id)
    )
  `);

  // Upload sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS upload_sessions (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_size INTEGER,
      uploaded_size INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      s3_key TEXT,
      multipart_upload_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add multipart_upload_id column if it doesn't exist (migration)
  db.run(`
    ALTER TABLE upload_sessions 
    ADD COLUMN multipart_upload_id TEXT
  `, (err) => {
    // Ignore error if column already exists
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding multipart_upload_id column:', err);
    }
  });

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
      about_text TEXT,
      custom_domain TEXT,
      primary_color TEXT DEFAULT '#000000',
      background_color TEXT DEFAULT '#ffffff',
      text_color TEXT DEFAULT '#333333',
      accent_color TEXT DEFAULT '#666666',
      font_family TEXT DEFAULT 'Inter, sans-serif',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (filmmaker_id) REFERENCES filmmakers (id)
    )
  `);

  // Add new styling columns if they don't exist (migration)
  const styleColumns = [
    { name: 'about_text', type: 'TEXT' },
    { name: 'primary_color', type: 'TEXT DEFAULT "#000000"' },
    { name: 'background_color', type: 'TEXT DEFAULT "#ffffff"' },
    { name: 'text_color', type: 'TEXT DEFAULT "#333333"' },
    { name: 'accent_color', type: 'TEXT DEFAULT "#666666"' },
    { name: 'font_family', type: 'TEXT DEFAULT "Inter, sans-serif"' },
    { name: 'twitter_url', type: 'TEXT' },
    { name: 'instagram_url', type: 'TEXT' },
    { name: 'facebook_url', type: 'TEXT' },
    { name: 'youtube_url', type: 'TEXT' },
    { name: 'tiktok_url', type: 'TEXT' },
    { name: 'linkedin_url', type: 'TEXT' },
    { name: 'imdb_url', type: 'TEXT' }
  ];

  styleColumns.forEach(col => {
    db.run(`ALTER TABLE microsites ADD COLUMN ${col.name} ${col.type}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Error adding ${col.name} column:`, err);
      }
    });
  });

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
});

module.exports = db;
