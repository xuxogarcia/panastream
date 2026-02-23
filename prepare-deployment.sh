#!/bin/bash

echo "🚀 PanaStream Deployment Preparation"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to server directory
cd server

echo "📋 This script will:"
echo "   1. Create a backup of your current database"
echo "   2. Clean up all media records and conversion jobs"
echo "   3. Remove local thumbnail files"
echo "   4. Reset database counters"
echo ""

# Ask for confirmation
read -p "🤔 Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo ""
echo "💾 Step 1: Creating database backup..."
node backup-database.js

echo ""
echo "🗑️  Step 2: Cleaning up database..."
node clean-database.js

echo ""
echo "✅ Deployment preparation completed!"
echo ""
echo "📁 Backup files are saved in: server/backups/"
echo "🚀 Ready for Digital Ocean deployment"
echo ""
echo "Next steps:"
echo "1. Review the changes: git status"
echo "2. Commit your changes: git add . && git commit -m 'Prepare for deployment - clean database'"
echo "3. Push to GitHub: git push origin main"
echo "4. Deploy to Digital Ocean App Platform"
echo ""
