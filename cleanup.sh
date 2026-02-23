#!/bin/bash

echo "🧹 PanaStream Database Cleanup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to server directory
cd server

echo "🗑️  Cleaning up database and local files..."
echo ""

# Run the cleanup script
node clean-database.js

echo ""
echo "✅ Cleanup completed!"
echo "🚀 Ready for Digital Ocean deployment"
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Clean database for deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy to Digital Ocean App Platform"
echo ""
