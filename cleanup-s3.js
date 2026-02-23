#!/usr/bin/env node

/**
 * S3 Cleanup Script for PanaStream
 * 
 * WARNING: This will delete ALL files in your S3 bucket!
 * Make sure you have backups if needed.
 * 
 * Usage: node cleanup-s3.js
 */

const AWS = require('aws-sdk');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: './server/.env' });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const bucketName = process.env.S3_BUCKET_NAME;

if (!bucketName) {
  console.error('❌ S3_BUCKET_NAME not found in environment variables');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function listAllObjects() {
  try {
    console.log(`📋 Listing all objects in bucket: ${bucketName}`);
    
    const params = {
      Bucket: bucketName
    };
    
    const objects = [];
    let continuationToken;
    
    do {
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      
      const response = await s3.listObjectsV2(params).promise();
      objects.push(...response.Contents);
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    if (objects.length === 0) {
      console.log('✅ Bucket is already empty!');
      return [];
    }
    
    console.log(`📊 Found ${objects.length} objects:`);
    objects.forEach((obj, index) => {
      console.log(`  ${index + 1}. ${obj.Key} (${(obj.Size / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    return objects;
  } catch (error) {
    console.error('❌ Error listing objects:', error.message);
    return [];
  }
}

async function deleteAllObjects(objects) {
  if (objects.length === 0) {
    console.log('✅ Nothing to delete');
    return;
  }
  
  try {
    console.log(`🗑️  Deleting ${objects.length} objects...`);
    
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: objects.map(obj => ({ Key: obj.Key }))
      }
    };
    
    const result = await s3.deleteObjects(deleteParams).promise();
    
    console.log(`✅ Successfully deleted ${result.Deleted.length} objects`);
    
    if (result.Errors && result.Errors.length > 0) {
      console.log('⚠️  Some objects failed to delete:');
      result.Errors.forEach(error => {
        console.log(`  - ${error.Key}: ${error.Message}`);
      });
    }
  } catch (error) {
    console.error('❌ Error deleting objects:', error.message);
  }
}

async function main() {
  console.log('🧹 PanaStream S3 Cleanup Tool');
  console.log('================================');
  console.log(`🎯 Target bucket: ${bucketName}`);
  console.log('');
  
  const objects = await listAllObjects();
  
  if (objects.length === 0) {
    rl.close();
    return;
  }
  
  console.log('');
  console.log('⚠️  WARNING: This will permanently delete ALL files in your S3 bucket!');
  console.log('   Make sure you have backups if needed.');
  console.log('');
  
  rl.question('Are you sure you want to continue? (type "yes" to confirm): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      await deleteAllObjects(objects);
      console.log('');
      console.log('🎉 S3 cleanup completed!');
    } else {
      console.log('❌ Cleanup cancelled');
    }
    rl.close();
  });
}

main().catch(console.error);
