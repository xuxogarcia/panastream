#!/bin/bash

echo "🚀 PanaStream Deployment (Fixed Ports)"
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

echo "✅ doctl is installed and authenticated"
echo ""

echo "🔧 This deployment fixes the port configuration:"
echo "   - Server will run on port 3001"
echo "   - Frontend will run on port 3000"
echo "   - Health check will target port 3000 (frontend)"
echo ""

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found in environment"
    echo "   You'll need to set them in Digital Ocean console after deployment"
    echo ""
fi

echo "🚀 Deploying with fixed port configuration..."
echo ""

doctl apps create --spec .do/app-no-docker.yaml --wait

echo ""
echo "✅ Deployment completed!"
echo ""
echo "The app should now:"
echo "  - Run server on port 3001"
echo "  - Run frontend on port 3000"
echo "  - Pass health checks on port 3000"
echo ""
echo "Next steps:"
echo "1. Check app status: doctl apps list"
echo "2. View logs: doctl apps logs <app-id>"
echo "3. Set AWS credentials in Digital Ocean console if needed"
echo ""
