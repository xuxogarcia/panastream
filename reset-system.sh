#!/bin/bash

# PanaStream System Reset Script
# This script will completely reset the PanaStream system for fresh testing

echo "🧹 PanaStream System Reset"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the PanaStream root directory"
    exit 1
fi

echo "⚠️  WARNING: This will delete ALL local data including:"
echo "   - Database (all media records)"
echo "   - Local thumbnails"
echo "   - Any cached files"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo ""
echo "🛑 Stopping all running processes..."

# Stop any running processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

echo "✅ Processes stopped"

echo ""
echo "🗑️  Cleaning local files..."

# Remove database
if [ -f "server/database.sqlite" ]; then
    rm -f server/database.sqlite
    echo "✅ Database removed"
else
    echo "ℹ️  No database found"
fi

# Remove thumbnails
if [ -d "server/public/thumbnails" ]; then
    rm -rf server/public/thumbnails/*
    echo "✅ Thumbnails removed"
else
    echo "ℹ️  No thumbnails directory found"
fi

# Remove any temporary files
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

echo "✅ Temporary files cleaned"

echo ""
echo "🔄 Recreating directories..."

# Recreate thumbnails directory
mkdir -p server/public/thumbnails

echo "✅ Directories recreated"

echo ""
echo "📋 System Status:"
echo "   - Database: Clean (will be recreated on first run)"
echo "   - Thumbnails: Clean"
echo "   - Processes: Stopped"
echo ""

echo "🚀 Ready for fresh testing!"
echo ""
echo "To start the system:"
echo "   npm run dev"
echo ""
echo "To clean S3 bucket (optional):"
echo "   node cleanup-s3.js"
echo ""
echo "To migrate existing database (if needed):"
echo "   cd server && node migrate-database.js"
echo ""
