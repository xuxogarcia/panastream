# Deploy PanaStream Server to DigitalOcean App Platform

## Quick Start Guide

This guide covers deploying **only the PanaStream server** to DigitalOcean App Platform in SFO3 region with the domain `your-app-name.ondigitalocean.app`.

## Prerequisites

1. DigitalOcean account
2. GitHub repository with PanaStream code
3. AWS credentials configured
4. Generated API token (see below)

## Step 1: Generate API Token

```bash
cd pana-stream
node generate-token.js
```

Save the generated token - you'll need it for both PanaStream and Fabricated Crime.

## Step 2: Prepare Your Repository

Ensure your repository structure includes:
```
pana-stream/
├── server/
│   ├── index.js
│   ├── package.json
│   ├── config/
│   ├── routes/
│   ├── middleware/
│   └── ...
├── app.yaml
└── generate-token.js
```

## Step 3: Deploy to DigitalOcean App Platform

### Option A: Using App Spec (app.yaml)

1. **Update `app.yaml`**:
   - Set your GitHub repo: `repo: your-org/pana-stream`
   - Verify region is `sfo3`
   - Domain is already set to `your-app-name.ondigitalocean.app`

2. **Create App in DigitalOcean**:
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Choose "GitHub" and select your repository
   - Select "app.yaml" as the app spec
   - DigitalOcean will read the configuration

3. **Set Environment Variables**:
   In the App Platform dashboard, add these as **SECRET** environment variables:
   
   **Required:**
   - `PANASTREAM_API_TOKEN` - Your generated token
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `S3_BUCKET_NAME` - Your S3 bucket
   - `MEDIACONVERT_ROLE_ARN` - MediaConvert IAM role ARN
   
   **Optional (with defaults):**
   - `NODE_ENV=production`
   - `PORT=3001`
   - `AWS_REGION=us-east-1`
   - `S3_UPLOAD_FOLDER=uploads`
   - `S3_PROCESSED_FOLDER=processed`
   - `CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net`
   - `FRONTEND_URL=https://your-domain.com`

### Option B: Manual Configuration

1. **Create App**:
   - Go to DigitalOcean App Platform
   - Click "Create App" → "GitHub"
   - Select your repository

2. **Configure Service**:
   - **Name**: `api`
   - **Source Directory**: `/server`
   - **Build Command**: `cd server && npm install`
   - **Run Command**: `cd server && npm start`
   - **Environment**: `Node.js`
   - **Instance Size**: `Basic XXS` (or larger)
   - **Instance Count**: `1`

3. **Configure Domain**:
   - Add domain: `your-app-name.ondigitalocean.app`
   - DigitalOcean will provide DNS instructions

4. **Set Environment Variables** (same as Option A)

## Step 4: Configure Fabricated Crime

In your Fabricated Crime deployment, set:

```bash
PANASTREAM_API_URL=https://your-app-name.ondigitalocean.app/api
PANASTREAM_API_TOKEN=your-generated-token-here
```

The Fabricated Crime server will automatically inject the token into HTML pages.

## Step 5: Verify Deployment

### Test Health Endpoint
```bash
curl https://your-app-name.ondigitalocean.app/health
```

Should return: `{"status":"OK","timestamp":"..."}`

### Test API with Token
```bash
curl -H "Authorization: Bearer your-token-here" \
     https://your-app-name.ondigitalocean.app/api/media
```

### Test API without Token (should fail)
```bash
curl https://your-app-name.ondigitalocean.app/api/media
```

Should return: `{"error":"Unauthorized",...}`

## Important Notes

1. **Server Only**: This deployment is for the server only - no client code
2. **Region**: Configured for SFO3 (San Francisco)
3. **Domain**: `your-app-name.ondigitalocean.app` (set in app.yaml)
4. **Database**: Uses SQLite by default. For production, consider a managed database
5. **Thumbnails**: Stored in `public/thumbnails` directory (persistent storage recommended)

## Database Considerations

### SQLite (Current)
- Simple, works out of the box
- Data stored in container (may be lost on redeploy)
- Not recommended for production with multiple instances

### Managed Database (Recommended for Production)
- Use DigitalOcean Managed Database (PostgreSQL)
- Update `config/database.js` to use PostgreSQL
- More reliable and scalable

## Troubleshooting

### Build Fails
- Check `source_dir: /server` is correct
- Verify `package.json` exists in server directory
- Check build logs in App Platform

### API Returns 401 Unauthorized
- Verify `PANASTREAM_API_TOKEN` is set correctly
- Check token matches between PanaStream and Fabricated Crime
- Ensure token is sent in `Authorization` header

### Domain Not Working
- Verify DNS is configured correctly
- Check domain is added in App Platform
- Wait for DNS propagation (can take up to 48 hours)

### Database Issues
- Ensure `DATABASE_PATH` is writable
- Check database file exists or will be created
- Consider using managed database for production

## Next Steps

1. Deploy PanaStream server to DO App Platform
2. Configure domain DNS (DigitalOcean will provide instructions)
3. Set environment variables
4. Deploy Fabricated Crime with API URL and token
5. Test the integration

Your PanaStream server will be accessible at `https://your-app-name.ondigitalocean.app`!

