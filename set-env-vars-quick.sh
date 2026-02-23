#!/bin/bash

echo "🔑 Setting Environment Variables for PanaStream"
echo "==============================================="
echo ""

APP_ID="5d24a202-20de-4450-8c87-3d3d1e6c5ec1"

echo "📋 Setting environment variables for app: $APP_ID"
echo ""

# AWS Access Key
read -p "Enter AWS_ACCESS_KEY_ID: " aws_access_key
if [ ! -z "$aws_access_key" ]; then
    doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env AWS_ACCESS_KEY_ID=$aws_access_key
    echo "✅ Set AWS_ACCESS_KEY_ID"
fi

# AWS Secret Key
read -p "Enter AWS_SECRET_ACCESS_KEY: " aws_secret_key
if [ ! -z "$aws_secret_key" ]; then
    doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env AWS_SECRET_ACCESS_KEY=$aws_secret_key
    echo "✅ Set AWS_SECRET_ACCESS_KEY"
fi

# AWS Region
read -p "Enter AWS_REGION (default: us-east-1): " aws_region
aws_region=${aws_region:-us-east-1}
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env AWS_REGION=$aws_region
echo "✅ Set AWS_REGION=$aws_region"

# App URLs (get from the app)
app_url="https://panastream-3xj8d.ondigitalocean.app"
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env FRONTEND_URL=$app_url
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env APP_URL=$app_url
doctl apps update $APP_ID --spec .do/app-no-docker.yaml --env REACT_APP_API_URL=$app_url/api
echo "✅ Set app URLs: $app_url"

echo ""
echo "✅ All environment variables set!"
echo ""
echo "🎯 Your app should now work with:"
echo "   - Backend API server running"
echo "   - Frontend serving the UI"
echo "   - AWS integration enabled"
echo ""
echo "🔍 Test the app: $app_url"
echo ""
