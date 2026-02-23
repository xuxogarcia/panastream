#!/bin/bash

echo "🧪 Testing Local Setup"
echo "====================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/package.json" ] || [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🔧 Testing server startup..."
cd server
PORT=3001 npm start &
SERVER_PID=$!
echo "✅ Server started on port 3001 (PID: $SERVER_PID)"

# Wait a moment for server to start
sleep 3

# Test server health
echo "🏥 Testing server health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Server health check passed"
else
    echo "❌ Server health check failed"
fi

# Test server API
echo "🔌 Testing server API..."
if curl -f http://localhost:3001/api/media > /dev/null 2>&1; then
    echo "✅ Server API accessible"
else
    echo "❌ Server API not accessible"
fi

# Stop server
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "✅ Local test completed!"
echo ""
echo "If all tests passed, the deployment should work."
echo "If tests failed, check the server configuration."
