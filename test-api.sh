#!/bin/bash
# Test PanaStream API endpoints
# Usage: ./test-api.sh [your-api-token]

API_URL="https://panastream.fabricatedcrime.io"
TOKEN="${1:-}"

echo "🧪 Testing PanaStream API"
echo "=========================="
echo "API URL: $API_URL"
echo ""

# Test 1: Health endpoint (no auth required)
echo "1️⃣  Testing /health endpoint (no auth)..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    echo "Response: $BODY"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 2: API endpoint without token (should fail)
echo "2️⃣  Testing /api/media without token (should fail)..."
NO_TOKEN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/api/media")
NO_TOKEN_CODE=$(echo "$NO_TOKEN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
NO_TOKEN_BODY=$(echo "$NO_TOKEN_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$NO_TOKEN_CODE" = "401" ]; then
    echo "✅ Correctly rejected request without token (HTTP 401)"
    echo "Response: $NO_TOKEN_BODY"
else
    echo "⚠️  Unexpected response (HTTP $NO_TOKEN_CODE)"
    echo "Response: $NO_TOKEN_BODY"
fi
echo ""

# Test 3: API endpoint with token (if provided)
if [ -z "$TOKEN" ]; then
    echo "3️⃣  Skipping authenticated test (no token provided)"
    echo "   To test with token, run: ./test-api.sh YOUR_TOKEN"
    echo ""
else
    echo "3️⃣  Testing /api/media with token..."
    WITH_TOKEN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-API-Key: $TOKEN" \
        "$API_URL/api/media")
    WITH_TOKEN_CODE=$(echo "$WITH_TOKEN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    WITH_TOKEN_BODY=$(echo "$WITH_TOKEN_RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$WITH_TOKEN_CODE" = "200" ]; then
        echo "✅ Authenticated request succeeded (HTTP 200)"
        echo "Response: $WITH_TOKEN_BODY" | head -c 200
        echo "..."
    else
        echo "❌ Authenticated request failed (HTTP $WITH_TOKEN_CODE)"
        echo "Response: $WITH_TOKEN_BODY"
    fi
    echo ""
    
    # Test 4: Test other endpoints
    echo "4️⃣  Testing /api/filmmakers with token..."
    FILMMAKERS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/api/filmmakers")
    FILMMAKERS_CODE=$(echo "$FILMMAKERS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    FILMMAKERS_BODY=$(echo "$FILMMAKERS_RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$FILMMAKERS_CODE" = "200" ]; then
        echo "✅ Filmmakers endpoint working (HTTP 200)"
        echo "Response: $FILMMAKERS_BODY" | head -c 200
        echo "..."
    else
        echo "⚠️  Filmmakers endpoint returned HTTP $FILMMAKERS_CODE"
        echo "Response: $FILMMAKERS_BODY"
    fi
    echo ""
fi

echo "=========================="
echo "✅ Testing complete!"

