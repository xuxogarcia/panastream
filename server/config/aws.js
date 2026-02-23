const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const s3 = new AWS.S3();
const mediaConvert = new AWS.MediaConvert(
  process.env.MEDIACONVERT_ENDPOINT ? { endpoint: process.env.MEDIACONVERT_ENDPOINT } : {}
);

// S3 configuration
const s3Config = {
  bucket: process.env.S3_BUCKET_NAME,
  uploadFolder: process.env.S3_UPLOAD_FOLDER || 'uploads',
  processedFolder: process.env.S3_PROCESSED_FOLDER || 'processed'
};

// CloudFront configuration
const cloudFrontConfig = {
  domain: process.env.CLOUDFRONT_DOMAIN
};

// MediaConvert configuration
const mediaConvertConfig = {
  roleArn: process.env.MEDIACONVERT_ROLE_ARN
};

module.exports = {
  s3,
  mediaConvert,
  s3Config,
  cloudFrontConfig,
  mediaConvertConfig
};
