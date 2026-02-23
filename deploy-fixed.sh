#!/bin/bash

echo "🚀 PanaStream Fixed Deployment"
echo "=============================="
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

# Ask for deployment type
echo "Choose deployment approach:"
echo "1. Docker-based deployment (with fixed dependencies)"
echo "2. Simple build deployment (no Docker)"
echo "3. No Docker deployment (recommended for dependency issues)"
echo "4. List existing apps"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🐳 Deploying with Docker..."
        echo "   Using: .do/app.yaml (with Dockerfile.simple)"
        doctl apps create --spec .do/app.yaml --wait
        ;;
    2)
        echo "🔧 Deploying with simple build..."
        echo "   Using: .do/app-simple.yaml (no Docker)"
        doctl apps create --spec .do/app-simple.yaml --wait
        ;;
    3)
        echo "🚀 Deploying without Docker (recommended)..."
        echo "   Using: .do/app-no-docker.yaml (no Docker, no dependency issues)"
        doctl apps create --spec .do/app-no-docker.yaml --wait
        ;;
    4)
        echo "📋 Existing apps:"
        doctl apps list
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Check app status: doctl apps list"
echo "2. View app details: doctl apps get <app-id>"
echo "3. View logs: doctl apps logs <app-id>"
echo ""
