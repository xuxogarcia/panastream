# Large File Upload Implementation

## Overview
Implemented S3 multipart upload support for files ≥ 5GB. Files under 5GB continue to use direct PUT upload for simplicity and speed.

## Changes Made

### 1. Server-Side (`server/routes/upload.js`)

#### Added Constants
- `SINGLE_UPLOAD_LIMIT`: 5GB - S3 single PUT limit
- `CHUNK_SIZE`: 100MB - chunk size for multipart uploads
- `MULTIPART_PART_MIN`: 5MB - minimum part size (except last part)

#### Updated `/session` Endpoint
- Detects if file is ≥ 5GB
- For large files: Initializes S3 multipart upload
- For small files: Generates presigned URL for direct PUT
- Returns `useMultipart` flag to client

#### New `/multipart/part-url` Endpoint
- Generates presigned URL for each multipart upload part
- Used by client to upload individual chunks

#### Updated `/complete` Endpoint
- Handles both direct upload completion and multipart upload completion
- For multipart: Accepts parts array with ETags and completes multipart upload
- Automatically aborts multipart upload on error

#### Updated Presigned URL Generation
- Calculates expiration based on file size (1 hour per 5GB, minimum 1 hour)
- Ensures large files have sufficient time to upload

### 2. Database (`server/config/database.js`)

#### Added `multipart_upload_id` Column
- Stores S3 multipart upload ID for large file uploads
- Migration handles existing databases automatically

### 3. Client-Side (`client/src/pages/Upload.js`)

#### Updated Upload Mutation
- Detects if server returned `useMultipart: true`
- **For large files (≥ 5GB)**:
  - Chunks file into 100MB parts
  - Uploads each part sequentially
  - Gets presigned URL for each part
  - Tracks progress per chunk
  - Collects ETags from each upload
  - Completes multipart upload with all parts
  
- **For small files (< 5GB)**:
  - Uses XMLHttpRequest for progress tracking
  - Uploads entire file in one request
  - More efficient for smaller files

## How It Works

### Small Files (< 5GB)
1. Client requests upload session
2. Server generates presigned PUT URL
3. Client uploads entire file directly to S3
4. Client calls `/complete` endpoint
5. Server updates database

### Large Files (≥ 5GB)
1. Client requests upload session
2. Server initializes S3 multipart upload
3. For each chunk (100MB):
   - Client requests presigned URL for part
   - Client uploads chunk to S3
   - Client stores ETag from response
4. Client calls `/complete` with all parts (PartNumber + ETag)
5. Server completes multipart upload on S3
6. Server updates database

## Benefits

✅ **Supports files up to 5TB** (S3 multipart limit)
✅ **Automatic detection** - No manual configuration needed
✅ **Progress tracking** - Shows progress for chunked uploads
✅ **Error handling** - Automatically aborts multipart upload on failure
✅ **Backward compatible** - Small files still use fast direct PUT
✅ **Dynamic expiration** - Presigned URLs expire based on file size

## Testing Recommendations

1. **Test with 6GB file** - Should use multipart upload
2. **Test with 10GB file** - Should use multipart upload
3. **Test with 3GB file** - Should use direct PUT
4. **Test progress tracking** - Verify progress updates correctly
5. **Test error handling** - Cancel upload mid-way, verify cleanup
6. **Test multiple files** - Upload multiple large files simultaneously

## Notes

- Chunks are uploaded sequentially (not in parallel) for simplicity
- Can be optimized later to upload 3-5 chunks in parallel for faster uploads
- ETags are automatically extracted from S3 response headers
- Presigned URLs expire based on file size (1 hour per 5GB)

