#!/usr/bin/env node

/**
 * Database Migration Script for PanaStream
 * 
 * This script migrates the database schema to fix field naming inconsistencies
 * between the database and frontend expectations.
 * 
 * Usage: node migrate-database.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting database migration...');

db.serialize(() => {
  // Check if the old columns exist
  db.get("PRAGMA table_info(media)", (err, row) => {
    if (err) {
      console.error('❌ Error checking table structure:', err);
      return;
    }
    
    // Get all column info
    db.all("PRAGMA table_info(media)", (err, columns) => {
      if (err) {
        console.error('❌ Error getting column info:', err);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      console.log('📋 Current columns:', columnNames);
      
      // Check if migration is needed
      const needsMigration = columnNames.includes('fileSize') || 
                           columnNames.includes('createdAt') || 
                           columnNames.includes('updatedAt');
      
      if (!needsMigration) {
        console.log('✅ Database is already up to date!');
        db.close();
        return;
      }
      
      console.log('🔧 Migration needed. Starting migration...');
      
      // Create new table with correct schema
      db.run(`
        CREATE TABLE media_new (
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
      `, (err) => {
        if (err) {
          console.error('❌ Error creating new table:', err);
          return;
        }
        
        console.log('✅ New table created');
        
        // Copy data from old table to new table
        db.run(`
          INSERT INTO media_new (
            id, title, description, genre, year, duration, filename,
            file_size, status, s3_key, cloudfront_url, thumbnail_path,
            mime_type, created_at, updated_at
          )
          SELECT 
            id, title, description, genre, year, duration, filename,
            COALESCE(fileSize, file_size, 0) as file_size,
            status, s3_key, cloudfront_url, thumbnail_path,
            mime_type,
            COALESCE(createdAt, created_at, CURRENT_TIMESTAMP) as created_at,
            COALESCE(updatedAt, updated_at, CURRENT_TIMESTAMP) as updated_at
          FROM media
        `, (err) => {
          if (err) {
            console.error('❌ Error copying data:', err);
            return;
          }
          
          console.log('✅ Data copied to new table');
          
          // Drop old table
          db.run('DROP TABLE media', (err) => {
            if (err) {
              console.error('❌ Error dropping old table:', err);
              return;
            }
            
            console.log('✅ Old table dropped');
            
            // Rename new table
            db.run('ALTER TABLE media_new RENAME TO media', (err) => {
              if (err) {
                console.error('❌ Error renaming table:', err);
                return;
              }
              
              console.log('✅ Table renamed');
              console.log('🎉 Database migration completed successfully!');
              
              // Verify the migration
              db.all("PRAGMA table_info(media)", (err, columns) => {
                if (err) {
                  console.error('❌ Error verifying migration:', err);
                  return;
                }
                
                const newColumnNames = columns.map(col => col.name);
                console.log('📋 New columns:', newColumnNames);
                
                // Count records
                db.get('SELECT COUNT(*) as count FROM media', (err, row) => {
                  if (err) {
                    console.error('❌ Error counting records:', err);
                    return;
                  }
                  
                  console.log(`📊 Total records migrated: ${row.count}`);
                  db.close();
                });
              });
            });
          });
        });
      });
    });
  });
});
