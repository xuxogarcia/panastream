#!/bin/bash

echo "🔧 Digital Ocean Environment Variables Setup"
echo "==========================================="
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
echo "📋 Existing apps:"
doctl apps list
echo ""

# Get app ID
read -p "Enter your app ID: " app_id

if [ -z "$app_id" ]; then
    echo "❌ App ID is required"
    exit 1
fi

echo ""
echo "🔑 Setting up environment variables for app: $app_id"
echo ""

# AWS Access Key
read -p "Enter AWS_ACCESS_KEY_ID: " aws_access_key
if [ ! -z "$aws_access_key" ]; then
    doctl apps update $app_id --env AWS_ACCESS_KEY_ID=$aws_access_key
    echo "✅ Set AWS_ACCESS_KEY_ID"
fi

# AWS Secret Key
read -p "Enter AWS_SECRET_ACCESS_KEY: " aws_secret_key
if [ ! -z "$aws_secret_key" ]; then
    doctl apps update $app_id --env AWS_SECRET_ACCESS_KEY=$aws_secret_key
    echo "✅ Set AWS_SECRET_ACCESS_KEY"
fi

# AWS Region
read -p "Enter AWS_REGION (default: us-east-1): " aws_region
aws_region=${aws_region:-us-east-1}
doctl apps update $app_id --env AWS_REGION=$aws_region
echo "✅ Set AWS_REGION=$aws_region"

# MediaConvert Endpoint (optional)
read -p "Enter MEDIACONVERT_ENDPOINT (optional - press Enter to skip): " mediaconvert_endpoint
if [ ! -z "$mediaconvert_endpoint" ]; then
    doctl apps update $app_id --env MEDIACONVERT_ENDPOINT=$mediaconvert_endpoint
    echo "✅ Set MEDIACONVERT_ENDPOINT"
else
    echo "ℹ️  Skipped MEDIACONVERT_ENDPOINT (AWS SDK will auto-discover)"
fi

# Get app URL
app_url=$(doctl apps get $app_id --format "{{.LiveURL}}" --no-header)
if [ ! -z "$app_url" ]; then
    doctl apps update $app_id --env FRONTEND_URL=$app_url
    doctl apps update $app_id --env APP_URL=$app_url
    doctl apps update $app_id --env REACT_APP_API_URL=$app_url/api
    echo "✅ Set app URLs: $app_url"
fi

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "Your app should now have access to AWS services."
echo "Check the app status: doctl apps get $app_id"
echo ""
