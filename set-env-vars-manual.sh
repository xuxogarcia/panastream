#!/bin/bash

echo "🔑 Setting Environment Variables for PanaStream"
echo "==============================================="
echo ""

echo "📋 Since doctl doesn't support --env flag directly, we'll update the app spec file"
echo ""

# Get AWS credentials
read -p "Enter AWS_ACCESS_KEY_ID: " aws_access_key
read -p "Enter AWS_SECRET_ACCESS_KEY: " aws_secret_key
read -p "Enter AWS_REGION (default: us-east-1): " aws_region
aws_region=${aws_region:-us-east-1}

# App URL
app_url="https://panastream-3xj8d.ondigitalocean.app"

echo ""
echo "🔧 Creating updated app specification with environment variables..."
echo ""

# Create a temporary app spec with the environment variables
cat > .do/app-with-env.yaml << EOF
name: panastream
services:
- name: app
  source_dir: /
  github:
    repo: pixaclara/panastream
    branch: main
  build_command: |
    cd server && npm install --production
    cd ../client && npm install && npm run build
  run_command: |
    cd server && PORT=3001 npm start &
    sleep 10
    cd client && npx serve -s build -l 3000 --single &
    wait
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  health_check:
    http_path: /
    initial_delay_seconds: 30
    period_seconds: 10
    timeout_seconds: 5
    success_threshold: 1
    failure_threshold: 3
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3001"
  - key: AWS_ACCESS_KEY_ID
    value: $aws_access_key
  - key: AWS_SECRET_ACCESS_KEY
    value: $aws_secret_key
  - key: AWS_REGION
    value: $aws_region
  - key: S3_BUCKET_NAME
    value: panastream-pixaclara
  - key: CLOUDFRONT_DOMAIN
    value: vod.panastream.pixaclara.io
  - key: MEDIACONVERT_ROLE_ARN
    value: arn:aws:iam::541759744703:role/los2marias-vod-MediaConvert
  - key: FRONTEND_URL
    value: $app_url
  - key: APP_URL
    value: $app_url
  - key: REACT_APP_API_URL
    value: $app_url/api
EOF

echo "✅ Created app specification with environment variables"
echo ""

# Deploy the updated app
echo "🚀 Deploying updated app with environment variables..."
doctl apps update 5d24a202-20de-4450-8c87-3d3d1e6c5ec1 --spec .do/app-with-env.yaml --wait

echo ""
echo "✅ App updated with environment variables!"
echo ""
echo "🎯 Your app should now work with:"
echo "   - Backend API server running"
echo "   - Frontend serving the UI"
echo "   - AWS integration enabled"
echo ""
echo "🔍 Test the app: $app_url"
echo ""

# Clean up temporary file
rm .do/app-with-env.yaml
echo "🧹 Cleaned up temporary files"
