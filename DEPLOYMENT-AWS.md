# AWS Credentials Deployment Guide

## 🚨 **Important: AWS Credentials Required**

Your PanaStream app **requires AWS credentials** to function. The current `.do/app.yaml` uses environment variable placeholders that need to be set.

## 🔧 **Option 1: Set Environment Variables (Recommended)**

### **Before Deployment:**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-east-1
export MEDIACONVERT_ENDPOINT=your_mediaconvert_endpoint
export FRONTEND_URL=https://your-app.ondigitalocean.app
export APP_URL=https://your-app.ondigitalocean.app
export REACT_APP_API_URL=https://your-app.ondigitalocean.app/api
```

### **Then Deploy:**
```bash
doctl apps create --spec .do/app.yaml --wait
```

## 🔧 **Option 2: Use Digital Ocean App Platform UI**

1. **Deploy without credentials first:**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **Add AWS credentials in Digital Ocean Console:**
   - Go to your app in Digital Ocean
   - Settings → Environment Variables
   - Add each AWS credential

## 🔧 **Option 3: Hardcode Credentials (Less Secure)**

1. **Edit `.do/app-with-aws.yaml`:**
   - Replace `YOUR_AWS_ACCESS_KEY_HERE` with your actual key
   - Replace `YOUR_AWS_SECRET_KEY_HERE` with your actual secret
   - Replace `YOUR_MEDIACONVERT_ENDPOINT_HERE` with your endpoint

2. **Deploy with hardcoded credentials:**
   ```bash
   doctl apps create --spec .do/app-with-aws.yaml --wait
   ```

## 📋 **Required AWS Credentials**

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `MEDIACONVERT_ENDPOINT` | MediaConvert endpoint | `https://account.mediaconvert.us-east-1.amazonaws.com` |

## 🚀 **Quick Deployment Script**

Use the provided script:
```bash
./deploy-with-aws.sh
```

This script will:
1. Check if AWS credentials are set
2. Deploy to Digital Ocean
3. Verify deployment

## ⚠️ **Security Notes**

- **Never commit AWS credentials** to your repository
- **Use environment variables** when possible
- **Rotate credentials** regularly
- **Use IAM roles** for production (if available)

## 🔍 **Verification**

After deployment, check:
1. **App Status**: `doctl apps list`
2. **App Logs**: `doctl apps logs <app-id>`
3. **Health Check**: Visit your app URL
4. **AWS Integration**: Try uploading a video

## 🆘 **Troubleshooting**

### **Deployment Fails**
- Check AWS credentials are valid
- Verify S3 bucket exists and is accessible
- Check MediaConvert endpoint is correct

### **App Starts but AWS Fails**
- Check environment variables in Digital Ocean console
- Verify AWS permissions
- Check app logs for specific errors

### **No AWS Credentials**
- Set environment variables before deployment
- Use Digital Ocean console to add credentials after deployment
- Or use the hardcoded approach (less secure)
