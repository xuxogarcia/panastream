#!/bin/bash

echo "🔧 Fixing Package Dependencies"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/package.json" ] || [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🗑️  Removing existing lock files and node_modules..."
rm -rf server/node_modules server/package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf node_modules package-lock.json

echo "📦 Reinstalling server dependencies..."
cd server
npm install
cd ..

echo "📦 Reinstalling client dependencies..."
cd client
npm install
cd ..

echo "📦 Reinstalling root dependencies..."
npm install

echo ""
echo "✅ Dependencies fixed!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy: ./deploy-fixed.sh"
echo ""
