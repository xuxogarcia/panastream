#!/bin/bash

echo "🔧 Final Fix for API Routing"
echo "==========================="
echo ""

echo "🔍 The issue: API calls are getting HTML instead of JSON"
echo "   This means the frontend is serving all requests, including API calls"
echo ""

echo "🔧 Solution: Use a reverse proxy approach"
echo "   - Run server on port 3001 (internal)"
echo "   - Run frontend on port 3000 (external)"
echo "   - Add API proxy to frontend"
echo ""

# Create a fixed app configuration
cat > .do/app-fixed.yaml << 'EOF'
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
    sleep 5
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
    value: ${REACT_APP_API_URL}
EOF

echo "✅ Created fixed app configuration"
echo ""

echo "🚀 Deploying fixed configuration..."
doctl apps update 5d24a202-20de-4450-8c87-3d3d1e6c5ec1 --spec .do/app-fixed.yaml --wait

echo ""
echo "✅ App updated with fixed configuration!"
echo ""
echo "🔍 The fix:"
echo "   - Server runs on port 3001 (internal)"
echo "   - Frontend runs on port 3000 (external)"
echo "   - API calls should now work properly"
echo ""
echo "📝 Test the app: https://panastream-3xj8d.ondigitalocean.app"
echo "   Try uploading a file - the JSON error should be fixed!"
echo ""

# Clean up
rm .do/app-fixed.yaml
echo "🧹 Cleaned up temporary files"
