# Migration Guide: SQLite to MySQL (DigitalOcean)

This guide covers migrating PanaStream from SQLite to MySQL on DigitalOcean.

## Prerequisites

1. **DigitalOcean MySQL Database** (Managed Database)
   - Create a MySQL database cluster in DigitalOcean
   - Note the connection details (host, port, database name, username, password)
   - Ensure it's in the same region as your App Platform app (SFO3)

2. **Backup Current SQLite Database**
   ```bash
   cp database.sqlite database.sqlite.backup
   ```

## Step 1: MySQL Schema Creation

Create the MySQL schema equivalent. The main differences from SQLite:
- `TEXT` → `VARCHAR(255)` or `TEXT` (for longer content)
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `INT AUTO_INCREMENT PRIMARY KEY`
- `DATETIME DEFAULT CURRENT_TIMESTAMP` → `DATETIME DEFAULT CURRENT_TIMESTAMP` (same)
- `BOOLEAN` → `TINYINT(1)` or `BOOLEAN`
- Foreign keys need explicit indexes in MySQL

### MySQL Schema

```sql
-- Media table
CREATE TABLE IF NOT EXISTS media (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  year INT,
  duration INT,
  filename VARCHAR(255),
  file_size BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  s3_key TEXT,
  cloudfront_url TEXT,
  thumbnail_path TEXT,
  mime_type VARCHAR(100),
  filmmaker_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_media_filmmaker (filmmaker_id),
  INDEX idx_media_status (status),
  INDEX idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Filmmakers table
CREATE TABLE IF NOT EXISTS filmmakers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_filmmakers_email (email),
  INDEX idx_filmmakers_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Microsites table
CREATE TABLE IF NOT EXISTS microsites (
  id VARCHAR(36) PRIMARY KEY,
  filmmaker_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  description TEXT,
  about_text TEXT,
  custom_domain VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#000000',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#333333',
  accent_color VARCHAR(7) DEFAULT '#666666',
  font_family VARCHAR(255) DEFAULT 'Inter, sans-serif',
  twitter_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  linkedin_url TEXT,
  imdb_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_microsites_filmmaker (filmmaker_id),
  INDEX idx_microsites_slug (slug),
  FOREIGN KEY (filmmaker_id) REFERENCES filmmakers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobId VARCHAR(255) UNIQUE NOT NULL,
  mediaId VARCHAR(36) NOT NULL,
  inputS3Key TEXT NOT NULL,
  outputS3Key TEXT,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME,
  INDEX idx_conversions_media (mediaId),
  INDEX idx_conversions_job (jobId),
  INDEX idx_conversions_status (status),
  FOREIGN KEY (mediaId) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upload sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT,
  uploaded_size BIGINT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING',
  s3_key TEXT,
  multipart_upload_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_upload_sessions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Step 2: Update Database Configuration

### Option A: Use mysql2 package (Recommended)

1. **Install mysql2:**
   ```bash
   cd /pana-stream/server
   npm install mysql2
   ```

2. **Create new database config file:** `config/database-mysql.js`
   ```javascript
   const mysql = require('mysql2/promise');
   
   const pool = mysql.createPool({
     host: process.env.MYSQL_HOST,
     port: process.env.MYSQL_PORT || 3306,
     user: process.env.MYSQL_USER,
     password: process.env.MYSQL_PASSWORD,
     database: process.env.MYSQL_DATABASE,
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
   });
   
   // Helper to convert SQLite-style queries to MySQL
   const db = {
     // Execute query and return results
     async query(sql, params = []) {
       const [rows] = await pool.execute(sql, params);
       return rows;
     },
     
     // Execute query and return first row
     async get(sql, params = []) {
       const [rows] = await pool.execute(sql, params);
       return rows[0] || null;
     },
     
     // Execute query and return all rows
     async all(sql, params = []) {
       const [rows] = await pool.execute(sql, params);
       return rows;
     },
     
     // Execute update/insert/delete
     async run(sql, params = []) {
       const [result] = await pool.execute(sql, params);
       return {
         lastID: result.insertId,
         changes: result.affectedRows
       };
     },
     
     // For compatibility with sqlite3 callback style
     serialize(callback) {
       callback();
     }
   };
   
   module.exports = db;
   ```

3. **Update `config/database.js` to support both:**
   ```javascript
   const useMySQL = process.env.USE_MYSQL === 'true';
   
   if (useMySQL) {
     module.exports = require('./database-mysql');
   } else {
     // Existing SQLite code
     const sqlite3 = require('sqlite3').verbose();
     // ... rest of SQLite setup
   }
   ```

## Step 3: Data Migration Script

Create `scripts/migrate-to-mysql.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '../database.sqlite');
const sqliteDb = new sqlite3.Database(sqlitePath);

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function migrateTable(tableName, transformRow = (row) => row) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`Migrating ${rows.length} rows from ${tableName}...`);
      
      for (const row of rows) {
        const transformed = transformRow(row);
        const columns = Object.keys(transformed).join(', ');
        const placeholders = Object.keys(transformed).map(() => '?').join(', ');
        const values = Object.values(transformed);
        
        const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) 
                     ON DUPLICATE KEY UPDATE ${Object.keys(transformed).map(k => `${k}=VALUES(${k})`).join(', ')}`;
        
        try {
          await mysqlPool.execute(sql, values);
        } catch (error) {
          console.error(`Error inserting row into ${tableName}:`, error);
          console.error('Row:', transformed);
        }
      }
      
      console.log(`✅ Migrated ${tableName}`);
      resolve();
    });
  });
}

async function migrate() {
  try {
    console.log('Starting migration from SQLite to MySQL...');
    
    // Migrate in order (respecting foreign keys)
    await migrateTable('filmmakers');
    await migrateTable('media');
    await migrateTable('microsites');
    await migrateTable('conversions');
    await migrateTable('upload_sessions');
    
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await mysqlPool.end();
  }
}

migrate();
```

## Step 4: Environment Variables

Add to DigitalOcean App Platform environment variables:

```
USE_MYSQL=true
MYSQL_HOST=your-db-host.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_USER=doadmin
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=panastream
MYSQL_SSL=true
```

## Step 5: Testing

1. **Test locally first:**
   ```bash
   # Set environment variables
   export USE_MYSQL=true
   export MYSQL_HOST=...
   # ... etc
   
   # Run migration
   node scripts/migrate-to-mysql.js
   
   # Test the app
   npm start
   ```

2. **Verify data:**
   - Check all tables have data
   - Test filmmaker login
   - Test media upload
   - Test microsite display

## Step 6: Deployment

1. **Deploy schema to MySQL:**
   - Connect to MySQL database
   - Run the CREATE TABLE statements

2. **Run migration:**
   - From a machine with access to both SQLite file and MySQL
   - Run the migration script

3. **Update App Platform:**
   - Add MySQL environment variables
   - Set `USE_MYSQL=true`
   - Redeploy

4. **Verify:**
   - Check logs for MySQL connection
   - Test all functionality
   - Monitor for any issues

## Rollback Plan

If issues occur:
1. Set `USE_MYSQL=false` in environment variables
2. Redeploy (will use SQLite again)
3. Fix issues and retry migration

## Notes

- **Foreign Keys:** MySQL enforces foreign keys, SQLite doesn't always. Ensure data integrity before migration.
- **Case Sensitivity:** MySQL table/column names are case-sensitive on Linux. Use consistent casing.
- **Transactions:** MySQL supports transactions better. Consider wrapping operations in transactions.
- **Connection Pooling:** MySQL uses connection pooling. Adjust pool size based on load.
- **SSL:** DigitalOcean MySQL requires SSL. Set `MYSQL_SSL=true`.

## Future Improvements

- Use a migration tool like `knex.js` or `sequelize` for better schema management
- Add database connection health checks
- Implement read replicas for better performance
- Add database backup automation

