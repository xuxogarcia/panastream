#!/usr/bin/env node

/**
 * Fix existing data script for PanaStream
 * 
 * This script fixes existing media records that have the old schema
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing existing media records...');

// First, let's see what we have
db.all("SELECT * FROM media", (err, rows) => {
  if (err) {
    console.error('❌ Error reading media records:', err);
    return;
  }
  
  console.log(`📊 Found ${rows.length} media records`);
  
  if (rows.length === 0) {
    console.log('✅ No records to fix');
    db.close();
    return;
  }
  
  // Check if we need to add missing columns
  db.get("PRAGMA table_info(media)", (err, row) => {
    if (err) {
      console.error('❌ Error checking table structure:', err);
      return;
    }
    
    db.all("PRAGMA table_info(media)", (err, columns) => {
      if (err) {
        console.error('❌ Error getting column info:', err);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      console.log('📋 Current columns:', columnNames);
      
      // Add missing columns if they don't exist
      const missingColumns = [];
      
      if (!columnNames.includes('file_size')) {
        missingColumns.push('ADD COLUMN file_size INTEGER');
      }
      if (!columnNames.includes('created_at')) {
        missingColumns.push('ADD COLUMN created_at DATETIME');
      }
      if (!columnNames.includes('updated_at')) {
        missingColumns.push('ADD COLUMN updated_at DATETIME');
      }
      
      if (missingColumns.length > 0) {
        console.log('🔧 Adding missing columns...');
        
        const alterPromises = missingColumns.map(column => {
          return new Promise((resolve, reject) => {
            db.run(`ALTER TABLE media ${column}`, (err) => {
              if (err) {
                console.error(`❌ Error adding column:`, err);
                reject(err);
              } else {
                console.log(`✅ Added column: ${column}`);
                resolve();
              }
            });
          });
        });
        
        Promise.all(alterPromises).then(() => {
          migrateData();
        }).catch((err) => {
          console.error('❌ Error adding columns:', err);
          db.close();
        });
      } else {
        migrateData();
      }
    });
  });
});

function migrateData() {
  console.log('🔄 Migrating data...');
  
  // Update existing records to use the new column names
  db.run(`
    UPDATE media 
    SET 
      file_size = COALESCE(fileSize, file_size, 0),
      created_at = COALESCE(createdAt, created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updatedAt, updated_at, CURRENT_TIMESTAMP),
      mime_type = COALESCE(mime_type, 'video/mp4')
    WHERE fileSize IS NOT NULL OR createdAt IS NOT NULL OR updatedAt IS NOT NULL
  `, function(err) {
    if (err) {
      console.error('❌ Error migrating data:', err);
      return;
    }
    
    console.log(`✅ Updated ${this.changes} records`);
    
    // Verify the migration
    db.all("SELECT id, title, file_size, created_at, updated_at, mime_type FROM media", (err, rows) => {
      if (err) {
        console.error('❌ Error verifying migration:', err);
        return;
      }
      
      console.log('📊 Migration results:');
      rows.forEach(row => {
        console.log(`  - ${row.title}:`);
        console.log(`    File Size: ${row.file_size || 'NULL'}`);
        console.log(`    Created: ${row.created_at || 'NULL'}`);
        console.log(`    Updated: ${row.updated_at || 'NULL'}`);
        console.log(`    MIME Type: ${row.mime_type || 'NULL'}`);
      });
      
      console.log('🎉 Data migration completed!');
      db.close();
    });
  });
}
