#!/bin/bash

echo "🔍 API Debug Script"
echo "=================="
echo ""

# Get the app ID
echo "📋 Your apps:"
doctl apps list
echo ""

read -p "Enter your app ID: " app_id

if [ -z "$app_id" ]; then
    echo "❌ App ID is required"
    exit 1
fi

echo ""
echo "🔍 Debugging app: $app_id"
echo ""

# Get app details
echo "📊 App Details:"
doctl apps get $app_id --format "{{.Spec.Name}} - {{.LiveURL}}"
echo ""

# Get app logs
echo "📝 Recent logs:"
doctl apps logs $app_id --follow=false --type=run
echo ""

# Check if app is running
echo "🏥 Health check:"
app_url=$(doctl apps get $app_id --format "{{.LiveURL}}" --no-header)
if [ ! -z "$app_url" ]; then
    echo "Testing: $app_url"
    if curl -f "$app_url" > /dev/null 2>&1; then
        echo "✅ App is accessible"
    else
        echo "❌ App is not accessible"
    fi
    
    echo ""
    echo "Testing API endpoint: $app_url/api"
    if curl -f "$app_url/api" > /dev/null 2>&1; then
        echo "✅ API is accessible"
    else
        echo "❌ API is not accessible"
        echo "Response:"
        curl -v "$app_url/api" 2>&1 | head -20
    fi
else
    echo "❌ Could not get app URL"
fi

echo ""
echo "🔧 Troubleshooting steps:"
echo "1. Check if both server and frontend are running"
echo "2. Verify environment variables are set"
echo "3. Check app logs for errors"
echo "4. Ensure port configuration is correct"
echo ""
