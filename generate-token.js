#!/usr/bin/env node
// Generate a secure API token for PanaStream
// Usage: node generate-token.js

const crypto = require('crypto');

// Generate a 64-character hex token (32 bytes)
const token = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 PanaStream API Token Generated\n');
console.log('='.repeat(60));
console.log(token);
console.log('='.repeat(60));
console.log('\n📋 Add this to your environment variables:');
console.log(`   PANASTREAM_API_TOKEN=${token}\n`);
console.log('⚠️  Keep this token secure and never commit it to git!\n');

