# Quick Start: Deploy PanaStream to DigitalOcean App Platform

## Overview
Deploy **PanaStream server only** to DigitalOcean App Platform:
- **Region**: SFO3 (San Francisco)
- **Domain**: `panastream.fabricatedcrime.com`
- **Type**: Server-only (no client code)

## Step-by-Step Deployment

### 1. Generate API Token

```bash
cd pana-stream
node generate-token.js
```

**Save this token** - you'll need it for both PanaStream and Fabricated Crime.

### 2. Update app.yaml

Edit `app.yaml` and set your GitHub repository:

```yaml
github:
  repo: your-username/pana-stream  # Change this!
  branch: main
```

### 3. Deploy to DigitalOcean

**Option A: Using app.yaml (Recommended)**

1. Push your code to GitHub
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click **"Create App"**
4. Select **"GitHub"** and choose your repository
5. DigitalOcean will detect `app.yaml` automatically
6. Review the configuration (region: SFO3, domain: panastream.fabricatedcrime.com)
7. Click **"Next"**

**Option B: Manual Configuration**

1. Create App → GitHub → Select repo
2. Configure:
   - **Source Directory**: `/server`
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **Environment**: Node.js
   - **Region**: SFO3
3. Add domain: `panastream.fabricatedcrime.com`

### 4. Set Environment Variables

In DigitalOcean App Platform dashboard, add these **SECRET** environment variables:

**Required Secrets:**
- `PANASTREAM_API_TOKEN` = (your generated token)
- `AWS_ACCESS_KEY_ID` = (your AWS key)
- `AWS_SECRET_ACCESS_KEY` = (your AWS secret)
- `S3_BUCKET_NAME` = (your S3 bucket)
- `MEDIACONVERT_ROLE_ARN` = (your MediaConvert role ARN)

**Standard Variables:**
- `NODE_ENV` = `production`
- `PORT` = `3001`
- `AWS_REGION` = `us-east-1`
- `S3_UPLOAD_FOLDER` = `uploads`
- `S3_PROCESSED_FOLDER` = `processed`
- `CLOUDFRONT_DOMAIN` = `vod.panastream.pixaclara.io`
- `FRONTEND_URL` = `https://fabricatedcrime.com`
- `APP_URL` = `https://panastream.fabricatedcrime.com`
- `DATABASE_PATH` = `./database.sqlite`

### 5. Configure Domain DNS

DigitalOcean will provide DNS instructions:
- Add CNAME record: `panastream.fabricatedcrime.com` → (DO provided URL)
- Or use DigitalOcean nameservers if managing DNS there

### 6. Configure Fabricated Crime

In your Fabricated Crime deployment, set:

```bash
PANASTREAM_API_URL=https://panastream.fabricatedcrime.com/api
PANASTREAM_API_TOKEN=(same token as PanaStream)
```

### 7. Verify Deployment

```bash
# Health check (no auth required)
curl https://panastream.fabricatedcrime.com/health

# API test (should fail without token)
curl https://panastream.fabricatedcrime.com/api/media

# API test (should succeed with token)
curl -H "Authorization: Bearer your-token" \
     https://panastream.fabricatedcrime.com/api/media
```

## Important Notes

✅ **Server Only**: This deploys only the `/server` directory - no client code  
✅ **Region**: Configured for SFO3  
✅ **Domain**: `panastream.fabricatedcrime.com`  
✅ **Containerized**: DigitalOcean handles containerization automatically  
✅ **Auto-deploy**: Configured to deploy on git push to main branch

## Troubleshooting

**Build fails?**
- Check `source_dir: /server` is correct
- Verify `package.json` exists in server directory
- Check build logs in App Platform

**401 Unauthorized?**
- Verify `PANASTREAM_API_TOKEN` is set
- Check token matches between services
- Ensure token is sent in Authorization header

**Domain not working?**
- Verify DNS is configured
- Wait for DNS propagation (up to 48 hours)
- Check domain is added in App Platform

## Next Steps

1. ✅ Deploy PanaStream server
2. ✅ Configure domain DNS
3. ✅ Set environment variables
4. ✅ Deploy Fabricated Crime with API URL and token
5. ✅ Test integration

Your API will be available at: `https://panastream.fabricatedcrime.com`

