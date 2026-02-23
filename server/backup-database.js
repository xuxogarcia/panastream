#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a backup of the current database before cleanup
 */

const db = require('./config/database');
const fs = require('fs');
const path = require('path');

console.log('💾 Creating database backup...');

// Function to export data to JSON
function exportData() {
  return new Promise((resolve, reject) => {
    const backupData = {
      timestamp: new Date().toISOString(),
      media: [],
      conversions: [],
      upload_sessions: []
    };
    
    // Export media records
    db.all('SELECT * FROM media', (err, rows) => {
      if (err) {
        console.error('❌ Error exporting media:', err);
        reject(err);
        return;
      }
      backupData.media = rows;
      console.log(`✅ Exported ${rows.length} media records`);
      
      // Export conversion jobs
      db.all('SELECT * FROM conversions', (err, rows) => {
        if (err) {
          console.error('❌ Error exporting conversions:', err);
          reject(err);
          return;
        }
        backupData.conversions = rows;
        console.log(`✅ Exported ${rows.length} conversion jobs`);
        
        // Export upload sessions
        db.all('SELECT * FROM upload_sessions', (err, rows) => {
          if (err) {
            console.error('❌ Error exporting upload sessions:', err);
            reject(err);
            return;
          }
          backupData.upload_sessions = rows;
          console.log(`✅ Exported ${rows.length} upload sessions`);
          
          // Save backup file
          const backupDir = path.join(__dirname, 'backups');
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
          
          fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
          console.log(`✅ Backup saved to: ${backupFile}`);
          
          resolve(backupFile);
        });
      });
    });
  });
}

// Main backup function
async function main() {
  try {
    console.log('🚀 PanaStream Database Backup');
    console.log('==============================');
    console.log('');
    
    const backupFile = await exportData();
    
    console.log('');
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup file: ${backupFile}`);
    console.log('');
    console.log('You can now run the cleanup script safely.');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('🔒 Database connection closed');
      }
    });
  }
}

// Run backup
main();
