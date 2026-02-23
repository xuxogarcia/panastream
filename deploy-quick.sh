#!/bin/bash

echo "🚀 Quick PanaStream Deployment (No Docker)"
echo "=========================================="
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

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found in environment"
    echo "   The deployment will use environment variable placeholders"
    echo "   You'll need to set them in Digital Ocean console after deployment"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "🚀 Deploying with no Docker approach..."
echo "   This avoids dependency issues and Docker complexity"
echo ""

doctl apps create --spec .do/app-no-docker.yaml --wait

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Check app status: doctl apps list"
echo "2. View app details: doctl apps get <app-id>"
echo "3. View logs: doctl apps logs <app-id>"
echo "4. Set AWS credentials in Digital Ocean console if needed"
echo ""
