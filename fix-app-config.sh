#!/bin/bash

echo "🔧 Fixing PanaStream App Configuration"
echo "======================================"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl is not installed. Please install it first:"
    echo "   brew install doctl"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with Digital Ocean"
    echo "   Run: doctl auth init"
    exit 1
fi

APP_ID="5d24a202-20de-4450-8c87-3d3d1e6c5ec1"

echo "🔍 Current issue:"
echo "   - App is only running frontend (React)"
echo "   - Backend API server is not running"
echo "   - API calls return HTML instead of JSON"
echo ""

echo "🔧 Fixing with proper configuration..."
echo "   This will configure both server and frontend to run together"
echo ""

# Update the app with the no-docker configuration
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --wait

echo ""
echo "✅ App updated with proper configuration!"
echo ""
echo "🔍 The app should now:"
echo "   - Run backend server on port 3001"
echo "   - Run frontend on port 3000"
echo "   - Handle API calls properly"
echo ""
echo "📝 Next steps:"
echo "1. Wait 2-3 minutes for deployment to complete"
echo "2. Test the app: https://panastream-3xj8d.ondigitalocean.app"
echo "3. Try uploading a file"
echo "4. Check logs: doctl apps logs $APP_ID"
echo ""
echo "🎯 The upload JSON error should now be fixed!"
echo ""
