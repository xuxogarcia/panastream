#!/bin/bash

echo "🔍 Checking Digital Ocean App Name"
echo "================================="
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

# List existing apps
echo "📋 Your existing apps:"
doctl apps list
echo ""

# Check current configuration
echo "📝 Current app.yaml configuration:"
echo "   App name: panastream"
echo "   GitHub repo: pixaclara/panastream"
echo ""

# Ask if they want to update
read -p "Do you want to update the app name? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Digital Ocean app name: " app_name
    if [ ! -z "$app_name" ]; then
        # Update the app.yaml file
        sed -i.bak "s/name: panastream/name: $app_name/" .do/app-no-docker.yaml
        echo "✅ Updated app name to: $app_name"
        echo "📝 Updated .do/app-no-docker.yaml"
    else
        echo "❌ App name cannot be empty"
    fi
else
    echo "ℹ️  Keeping current app name: panastream"
fi

echo ""
echo "🚀 Next steps:"
echo "1. If you updated the name, redeploy with:"
echo "   doctl apps create --spec .do/app-no-docker.yaml"
echo "2. If keeping current name, check if app exists:"
echo "   doctl apps list | grep panastream"
echo ""
