#!/bin/bash

echo "🚀 PanaStream Digital Ocean Deployment"
echo "======================================"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl is not installed. Please install it first:"
    echo "   brew install doctl"
    echo "   or visit: https://github.com/digitalocean/doctl"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with Digital Ocean"
    echo "   Run: doctl auth init"
    exit 1
fi

# Check if app.yaml exists
if [ ! -f ".do/app.yaml" ]; then
    echo "❌ .do/app.yaml not found"
    exit 1
fi

echo "✅ doctl is installed and authenticated"
echo "✅ App configuration found"
echo ""

# Ask for deployment type
echo "Choose deployment option:"
echo "1. Create new app"
echo "2. Update existing app"
echo "3. List existing apps"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🆕 Creating new app..."
        doctl apps create --spec .do/app.yaml --wait
        ;;
    2)
        echo "📋 Listing existing apps..."
        doctl apps list
        echo ""
        read -p "Enter app ID to update: " app_id
        echo "🔄 Updating app $app_id..."
        doctl apps update $app_id --spec .do/app.yaml --wait
        ;;
    3)
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
