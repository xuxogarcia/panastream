#!/bin/bash

echo "🚀 PanaStream Deployment with AWS Credentials"
echo "============================================="
echo ""

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not found in environment"
    echo ""
    echo "Please set your AWS credentials:"
    echo "export AWS_ACCESS_KEY_ID=your_access_key"
    echo "export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "export AWS_REGION=us-east-1"
    echo "export MEDIACONVERT_ENDPOINT=your_mediaconvert_endpoint"
    echo ""
    echo "Or create a .env file with your credentials"
    exit 1
fi

echo "✅ AWS credentials found"
echo "   AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:8}..."
echo "   AWS_REGION: ${AWS_REGION}"
echo ""

# Deploy with environment variables
echo "🚀 Deploying to Digital Ocean..."
doctl apps create --spec .do/app.yaml --wait

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Your app is now running with AWS integration!"
