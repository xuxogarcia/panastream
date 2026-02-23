#!/bin/bash

echo "🔄 Updating Existing PanaStream App"
echo "=================================="
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

echo "✅ doctl is installed and authenticated"
echo ""

# Your existing app details
APP_ID="5d24a202-20de-4450-8c87-3d3d1e6c5ec1"
APP_NAME="panastream"
APP_URL="https://panastream-3xj8d.ondigitalocean.app"

echo "📋 Found existing app:"
echo "   ID: $APP_ID"
echo "   Name: $APP_NAME"
echo "   URL: $APP_URL"
echo ""

echo "🔧 Updating app with fixed configuration..."
echo "   This will fix the port configuration and API routing issues"
echo ""

# Update the existing app
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --wait

echo ""
echo "✅ App updated successfully!"
echo ""
echo "🔍 Next steps:"
echo "1. Check app status: doctl apps get $APP_ID"
echo "2. View logs: doctl apps logs $APP_ID"
echo "3. Test the app: $APP_URL"
echo "4. Set environment variables if not already set:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - AWS_REGION"
echo ""
echo "🎯 The upload issue should now be fixed!"
echo ""
