# PanaStream Deployment Guide - DigitalOcean App Platform

## Overview
This guide covers deploying **PanaStream server only** to DigitalOcean App Platform in SFO3 region with the domain `your-app-name.ondigitalocean.app`.

**Note**: This is a server-only deployment. The client code is not needed.

## Prerequisites
- DigitalOcean account
- AWS credentials configured
- Database file (SQLite) or plan to use managed database

## Step 1: Generate API Token

Generate a secure random token for API authentication:

```bash
# Option 1: Use the provided script (recommended)
cd pana-stream
node generate-token.js

# Option 2: Use OpenSSL
openssl rand -hex 32

# Option 3: Use Node.js directly
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ Save this token securely** - you'll need it for both PanaStream and Fabricated Crime deployments.

## Step 2: Configure Environment Variables

In DigitalOcean App Platform, set these environment variables:

### Required Variables:
- `PANASTREAM_API_TOKEN` - Your generated secure token
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `S3_BUCKET_NAME` - Your S3 bucket name
- `CLOUDFRONT_DOMAIN` - Your CloudFront domain
- `MEDIACONVERT_ROLE_ARN` - MediaConvert IAM role ARN
- `NODE_ENV=production`

### Optional Variables:
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Allowed frontend URL for CORS
- `DATABASE_PATH` - Path to SQLite database

## Step 3: Configure Fabricated Crime

In your Fabricated Crime deployment, set:

- `PANASTREAM_API_URL` - Your PanaStream API URL (e.g., `https://panastream.yourdomain.com/api`)
- `PANASTREAM_API_TOKEN` - Same token as PanaStream

## Step 4: App Spec Configuration

For DigitalOcean App Platform, your app spec should include:

```yaml
name: panastream
services:
  - name: api
    github:
      repo: your-org/panastream
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: PANASTREAM_API_TOKEN
        scope: RUN_TIME
        type: SECRET
      - key: AWS_ACCESS_KEY_ID
        scope: RUN_TIME
        type: SECRET
      # ... other env vars
```

## Step 5: Database Considerations

### Option 1: SQLite (Simple, but not recommended for production)
- Upload your `database.sqlite` file
- Set `DATABASE_PATH` environment variable

### Option 2: Managed Database (Recommended)
- Use DigitalOcean Managed Database (PostgreSQL)
- Update database connection in `config/database.js`
- Run migrations on first deploy

## Step 6: Static Files

Ensure `public/thumbnails` directory is created and writable:
- App Platform will create this automatically
- Thumbnails will be stored in the container

## Security Notes

1. **API Token**: Never commit tokens to git. Use environment variables only.
2. **CORS**: In production, restrict CORS to your Fabricated Crime domain
3. **Rate Limiting**: Already configured (100 requests per 15 min in production)
4. **HTTPS**: App Platform provides HTTPS automatically

## Testing

After deployment, test the API:

```bash
# Without token (should fail in production)
curl https://your-panastream-url.com/api/media

# With token (should succeed)
curl -H "Authorization: Bearer your-token-here" https://your-panastream-url.com/api/media
```

## Troubleshooting

- Check App Platform logs for errors
- Verify environment variables are set correctly
- Ensure database file is accessible
- Check AWS credentials are valid
