#!/bin/bash

echo "🔧 Fix API with Environment Variable"
echo "===================================="
echo ""

echo "📋 Solution: Set REACT_APP_API_URL to point to backend server"
echo ""

# Create app spec with correct API URL
cat > .do/app-with-api-url.yaml << 'EOF'
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
    value: ${AWS_ACCESS_KEY_ID}
  - key: AWS_SECRET_ACCESS_KEY
    value: ${AWS_SECRET_ACCESS_KEY}
  - key: AWS_REGION
    value: ${AWS_REGION}
  - key: S3_BUCKET_NAME
    value: panastream-pixaclara
  - key: CLOUDFRONT_DOMAIN
    value: vod.panastream.pixaclara.io
  - key: MEDIACONVERT_ROLE_ARN
    value: arn:aws:iam::541759744703:role/los2marias-vod-MediaConvert
  - key: FRONTEND_URL
    value: ${FRONTEND_URL}
  - key: APP_URL
    value: ${APP_URL}
  - key: REACT_APP_API_URL
    value: https://panastream-3xj8d.ondigitalocean.app:3001/api
EOF

echo "✅ Created app spec with API URL pointing to backend"
echo ""

echo "🚀 Deploying with correct API URL..."
doctl apps update 5d24a202-20de-4450-8c87-3d3d1e6c5ec1 --spec .do/app-with-api-url.yaml --wait

echo ""
echo "✅ App updated with correct API URL!"
echo ""
echo "🔍 How it works:"
echo "   - Backend runs on port 3001 (internal)"
echo "   - Frontend runs on port 3000 (external)"
echo "   - REACT_APP_API_URL points to backend server"
echo ""
echo "📝 Test the app: https://panastream-3xj8d.ondigitalocean.app"
echo "   The JSON error should now be fixed!"
echo ""

# Clean up
rm .do/app-with-api-url.yaml
echo "🧹 Cleaned up temporary files"
