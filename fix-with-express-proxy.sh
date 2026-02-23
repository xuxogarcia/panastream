#!/bin/bash

echo "🔧 Fix with Express Proxy"
echo "========================="
echo ""

echo "📋 The issue: serve doesn't support --proxy flag"
echo "   Solution: Create a simple Express proxy server"
echo ""

# Create a simple Express proxy server
cat > proxy-server.js << 'EOF'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Proxy API requests to the backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 API requests proxied to localhost:3001`);
  console.log(`🌐 Frontend served from client/build`);
});
EOF

echo "✅ Created Express proxy server"
echo ""

# Add http-proxy-middleware to server dependencies
echo "📦 Adding http-proxy-middleware dependency..."
cat >> server/package.json << 'EOF'
,
  "http-proxy-middleware": "^2.0.6"
EOF

echo "✅ Added http-proxy-middleware to server dependencies"
echo ""

# Create updated app spec
cat > .do/app-with-express-proxy.yaml << 'EOF'
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
    node ../proxy-server.js &
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

echo "✅ Created app spec with Express proxy"
echo ""

echo "🚀 Deploying with Express proxy..."
doctl apps update 5d24a202-20de-4450-8c87-3d3d1e6c5ec1 --spec .do/app-with-express-proxy.yaml --wait

echo ""
echo "✅ App updated with Express proxy!"
echo ""
echo "🔍 How it works:"
echo "   - Backend runs on port 3001 (internal)"
echo "   - Express proxy runs on port 3000 (external)"
echo "   - Express serves static files and proxies /api/* to backend"
echo ""
echo "📝 Test the app: https://panastream-3xj8d.ondigitalocean.app"
echo "   The JSON error should now be fixed!"
echo ""

# Clean up
rm proxy-server.js .do/app-with-express-proxy.yaml
echo "🧹 Cleaned up temporary files"
