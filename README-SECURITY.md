# PanaStream API Security

## Overview
PanaStream uses API token authentication to secure API endpoints when deployed to production.

## How It Works

### Development Mode (Local)
- **No token required** - API is open for local development
- Token authentication is skipped if `PANASTREAM_API_TOKEN` is not set
- Perfect for local testing and development

### Production Mode
- **Token required** - All API requests must include a valid token
- Token is validated on every API request
- Supports both `Authorization: Bearer <token>` and `X-API-Key: <token>` headers

## Token Generation

Generate a secure token:

```bash
node generate-token.js
```

This generates a 64-character hexadecimal token (32 bytes of entropy).

## Configuration

### PanaStream Server

Set environment variable:
```bash
PANASTREAM_API_TOKEN=your-generated-token-here
```

### Fabricated Crime Client

The client automatically:
1. Reads token from `<meta name="panastream-api-token">` tag (injected by server)
2. Sends token in `Authorization: Bearer <token>` header
3. Falls back to `X-API-Key` header if needed

Set environment variables in Fabricated Crime:
```bash
PANASTREAM_API_TOKEN=your-generated-token-here
PANASTREAM_API_URL=https://your-panastream-domain.com/api
```

## Security Best Practices

1. **Never commit tokens to git** - Use environment variables only
2. **Use different tokens per environment** - Dev, staging, production
3. **Rotate tokens regularly** - Generate new tokens periodically
4. **Use HTTPS in production** - Always use encrypted connections
5. **Restrict CORS** - Only allow your Fabricated Crime domain
6. **Monitor API usage** - Watch for unusual patterns

## Testing Authentication

### Test without token (should fail in production):
```bash
curl https://your-panastream-url.com/api/media
```

### Test with token (should succeed):
```bash
curl -H "Authorization: Bearer your-token-here" \
     https://your-panastream-url.com/api/media
```

### Test with X-API-Key header:
```bash
curl -H "X-API-Key: your-token-here" \
     https://your-panastream-url.com/api/media
```

## Token Storage

### DigitalOcean App Platform
- Store as **SECRET** environment variable
- Mark as `type: SECRET` in app spec
- Never expose in logs or responses

### Local Development
- Store in `.env` file (not committed to git)
- Add `.env` to `.gitignore`
- Use different token than production

## Troubleshooting

### "Unauthorized" errors
- Check token is set correctly in environment
- Verify token matches between PanaStream and Fabricated Crime
- Check token is being sent in request headers (check browser console)

### Token not working
- Ensure token has no extra spaces or newlines
- Verify token is exactly 64 characters
- Check environment variable is loaded (restart server if needed)

### Development issues
- If token is not set, authentication is skipped (dev mode)
- Set `NODE_ENV=development` to explicitly enable dev mode
- Check middleware logs for authentication status

