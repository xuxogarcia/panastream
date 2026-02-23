# Testing PanaStream API

## Quick Test Commands

### 1. Health Check (No Auth Required)
```bash
curl https://panastream.fabricatedcrime.io/health
```

**Expected Response:**
```json
{"status":"OK","timestamp":"2025-11-07T..."}
```

### 2. Test API Without Token (Should Fail)
```bash
curl https://panastream.fabricatedcrime.io/api/media
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Valid API token required. Provide token in Authorization: Bearer <token> or X-API-Key header."
}
```
**HTTP Status:** `401 Unauthorized`

### 3. Test API With Token (Should Succeed)
```bash
# Replace YOUR_TOKEN with your actual token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://panastream.fabricatedcrime.io/api/media
```

**Or using X-API-Key header:**
```bash
curl -H "X-API-Key: YOUR_TOKEN" \
     https://panastream.fabricatedcrime.io/api/media
```

**Expected Response:**
```json
{
  "media": [...],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```
**HTTP Status:** `200 OK`

### 4. Test Other Endpoints

**Filmmakers:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://panastream.fabricatedcrime.io/api/filmmakers
```

**Microsites:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://panastream.fabricatedcrime.io/api/microsites
```

**Library:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://panastream.fabricatedcrime.io/api/library
```

## Using the Test Script

A test script is provided for comprehensive testing:

```bash
# Test without token (health check and auth rejection)
./test-api.sh

# Test with token (full API testing)
./test-api.sh YOUR_TOKEN_HERE
```

## Verify Token is Working

### Test 1: Without Token (Should Fail)
```bash
curl -v https://panastream.fabricatedcrime.io/api/media 2>&1 | grep -E "(HTTP|401|Unauthorized)"
```

### Test 2: With Token (Should Succeed)
```bash
TOKEN="your-token-here"
curl -v -H "Authorization: Bearer $TOKEN" \
     https://panastream.fabricatedcrime.io/api/media 2>&1 | grep -E "(HTTP|200|media)"
```

## Common Issues

### 401 Unauthorized
- **Cause:** Token not provided or incorrect
- **Fix:** Verify token is set correctly in environment variables
- **Check:** Token matches between PanaStream and Fabricated Crime

### 404 Not Found
- **Cause:** Wrong endpoint or domain
- **Fix:** Verify domain is `panastream.fabricatedcrime.io` and endpoint path is correct

### Connection Refused
- **Cause:** Service not running or DNS not propagated
- **Fix:** Check DigitalOcean App Platform status, wait for DNS propagation

### CORS Errors (from browser)
- **Cause:** Frontend domain not in CORS allowlist
- **Fix:** Verify `FRONTEND_URL` environment variable is set correctly

## Testing from Fabricated Crime

Once PanaStream is deployed, update Fabricated Crime:

```bash
# In Fabricated Crime environment variables
PANASTREAM_API_URL=https://panastream.fabricatedcrime.io/api
PANASTREAM_API_TOKEN=your-token-here
```

Then test from the browser console:
```javascript
// Should work if token is injected correctly
fetch('/api/media', {
  headers: {
    'Authorization': 'Bearer ' + document.querySelector('meta[name="panastream-api-token"]').content
  }
})
.then(r => r.json())
.then(console.log);
```

