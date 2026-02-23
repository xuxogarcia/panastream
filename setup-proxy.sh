#!/bin/bash

echo "🔧 Setting up API Proxy Solution"
echo "================================="
echo ""

echo "📋 The issue: Frontend is serving all requests, including API calls"
echo "   Solution: Use nginx or a reverse proxy to route API calls to backend"
echo ""

# Create nginx configuration for reverse proxy
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server localhost:3001;
    }

    server {
        listen 3000;
        server_name localhost;

        # Serve static files
        location / {
            root /app/client/build;
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to backend
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

echo "✅ Created nginx configuration"
echo ""

# Create updated app spec with nginx
cat > .do/app-with-nginx.yaml << 'EOF'
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
    apk add --no-cache nginx
  run_command: |
    cd server && PORT=3001 npm start &
    sleep 5
    nginx -c /app/nginx.conf &
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
    value: your-cloudfront-domain.cloudfront.net
  - key: MEDIACONVERT_ROLE_ARN
    value: arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_MEDIACONVERT_ROLE
  - key: FRONTEND_URL
    value: ${FRONTEND_URL}
  - key: APP_URL
    value: ${APP_URL}
  - key: REACT_APP_API_URL
    value: ${REACT_APP_API_URL}
EOF

echo "✅ Created app spec with nginx reverse proxy"
echo ""

echo "🚀 Deploying with nginx reverse proxy..."
doctl apps update 5d24a202-20de-4450-8c87-3d3d1e6c5ec1 --spec .do/app-with-nginx.yaml --wait

echo ""
echo "✅ App updated with nginx reverse proxy!"
echo ""
echo "🔍 How it works:"
echo "   - Backend runs on port 3001 (internal)"
echo "   - Nginx runs on port 3000 (external)"
echo "   - Nginx serves static files from /client/build"
echo "   - Nginx proxies /api/* requests to backend"
echo ""
echo "📝 Test the app: https://panastream-3xj8d.ondigitalocean.app"
echo "   The JSON error should now be fixed!"
echo ""

# Clean up
rm nginx.conf .do/app-with-nginx.yaml
echo "🧹 Cleaned up temporary files"
