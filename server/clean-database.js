#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes all existing media records and conversion jobs before deployment
 */

const db = require('./config/database');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting database cleanup...');

// Function to clean up database tables
function cleanDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗑️  Cleaning up database tables...');
    
    // Delete all conversion jobs first (foreign key constraint)
    db.run('DELETE FROM conversions', (err) => {
      if (err) {
        console.error('❌ Error deleting conversions:', err);
        reject(err);
        return;
      }
      console.log('✅ Deleted all conversion jobs');
      
      // Delete all media records
      db.run('DELETE FROM media', (err) => {
        if (err) {
          console.error('❌ Error deleting media:', err);
          reject(err);
          return;
        }
        console.log('✅ Deleted all media records');
        
        // Delete all upload sessions
        db.run('DELETE FROM upload_sessions', (err) => {
          if (err) {
            console.error('❌ Error deleting upload sessions:', err);
            reject(err);
            return;
          }
          console.log('✅ Deleted all upload sessions');
          
          resolve();
        });
      });
    });
  });
}

// Function to clean up local files
function cleanLocalFiles() {
  console.log('🗑️  Cleaning up local files...');
  
  try {
    // Clean up thumbnails directory
    const thumbnailsDir = path.join(__dirname, 'public/thumbnails');
    if (fs.existsSync(thumbnailsDir)) {
      const files = fs.readdirSync(thumbnailsDir);
      files.forEach(file => {
        const filePath = path.join(thumbnailsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`✅ Deleted thumbnail: ${file}`);
        }
      });
    }
    
    // Clean up temp directory
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`✅ Deleted temp directory: ${file}`);
        }
      });
    }
    
    console.log('✅ Local files cleaned up');
  } catch (error) {
    console.error('⚠️  Warning: Error cleaning up local files:', error.message);
  }
}

// Function to reset auto-increment counters
function resetCounters() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Resetting database counters...');
    
    // Reset SQLite auto-increment counters
    db.run('DELETE FROM sqlite_sequence', (err) => {
      if (err) {
        console.error('❌ Error resetting counters:', err);
        reject(err);
        return;
      }
      console.log('✅ Database counters reset');
      resolve();
    });
  });
}

// Function to show database stats
function showStats() {
  return new Promise((resolve) => {
    console.log('📊 Database statistics:');
    
    db.get('SELECT COUNT(*) as count FROM media', (err, row) => {
      if (err) {
        console.error('❌ Error getting media count:', err);
      } else {
        console.log(`   Media records: ${row.count}`);
      }
      
      db.get('SELECT COUNT(*) as count FROM conversions', (err, row) => {
        if (err) {
          console.error('❌ Error getting conversions count:', err);
        } else {
          console.log(`   Conversion jobs: ${row.count}`);
        }
        
        db.get('SELECT COUNT(*) as count FROM upload_sessions', (err, row) => {
          if (err) {
            console.error('❌ Error getting upload sessions count:', err);
          } else {
            console.log(`   Upload sessions: ${row.count}`);
          }
          
          resolve();
        });
      });
    });
  });
}

// Main cleanup function
async function main() {
  try {
    console.log('🚀 PanaStream Database Cleanup');
    console.log('================================');
    
    // Show initial stats
    await showStats();
    
    // Clean up database
    await cleanDatabase();
    
    // Clean up local files
    cleanLocalFiles();
    
    // Reset counters
    await resetCounters();
    
    // Show final stats
    console.log('\n📊 Final database statistics:');
    await showStats();
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('🚀 Ready for Digital Ocean deployment');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
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

// Run cleanup
main();
