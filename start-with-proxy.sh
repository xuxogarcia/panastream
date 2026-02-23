#!/bin/bash

echo "🚀 Starting PanaStream with API Proxy"
echo "===================================="

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    wait
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start server in background
echo "🔧 Starting API server on port 3001..."
cd server
PORT=3001 npm start &
SERVER_PID=$!
echo "✅ API server started (PID: $SERVER_PID) on port 3001"

# Wait for server to start
sleep 5

# Start client with proxy configuration
echo "🌐 Starting frontend with API proxy..."
cd ../client

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building client..."
    npm run build
fi

# Start serve with proxy configuration
npx serve -s build -l 3000 --single &
CLIENT_PID=$!
echo "✅ Frontend server started (PID: $CLIENT_PID) on port 3000"

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ API server failed to start"
    exit 1
fi

if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo "🎬 Both services are running!"
echo "   API Server: http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   API Proxy: Frontend will proxy /api/* to backend"
echo ""

# Keep the script running
wait $SERVER_PID $CLIENT_PID
