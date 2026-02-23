#!/bin/bash

echo "🔧 Fixing API Routing Issue"
echo "==========================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/index.js" ] || [ ! -f "client/src/services/api.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🔍 The issue is likely that the API server isn't running properly"
echo "   or there's a port configuration problem."
echo ""

echo "📋 Current configuration:"
echo "   - Server should run on port 3001"
echo "   - Frontend should run on port 3000"
echo "   - API calls should go to /api (same host)"
echo ""

echo "🔧 Let's check the current setup..."

# Check if server has proper port configuration
echo "📝 Checking server configuration..."
if grep -q "PORT.*3001" server/index.js; then
    echo "✅ Server configured for port 3001"
else
    echo "❌ Server not configured for port 3001"
fi

# Check if client API configuration is correct
echo "📝 Checking client API configuration..."
if grep -q "NODE_ENV.*production" client/src/services/api.js; then
    echo "✅ Client configured for production"
else
    echo "❌ Client not configured for production"
fi

echo ""
echo "🚀 Quick fixes to try:"
echo ""
echo "1. Check your Digital Ocean app logs:"
echo "   doctl apps logs <app-id>"
echo ""
echo "2. Verify environment variables are set:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - AWS_REGION"
echo ""
echo "3. Check if both services are running:"
echo "   - Server on port 3001"
echo "   - Frontend on port 3000"
echo ""
echo "4. Test API endpoint directly:"
echo "   curl https://your-app.ondigitalocean.app/api/health"
echo ""
echo "5. If still failing, redeploy with:"
echo "   ./deploy-fixed-ports.sh"
echo ""
