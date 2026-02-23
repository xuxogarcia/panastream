# Upload Limits Analysis

## Current Configuration

### Client-Side Limits
- **Location**: `client/src/pages/Upload.js:362`
- **Limit**: 10GB (`maxSize: 10 * 1024 * 1024 * 1024`)
- ✅ Allows files up to 10GB

### Server-Side Limits

#### Express Body Parser
- **Location**: `server/index.js:26-27`
- **JSON Limit**: 50MB
- **URL Encoded Limit**: 50MB
- ⚠️ **Issue**: Not relevant for direct S3 uploads, but should be increased for consistency

#### Multer Configuration
- **Location**: `server/routes/upload.js:12`
- **Limit**: 10GB (`fileSize: 10 * 1024 * 1024 * 1024`)
- **Storage**: Memory storage (`multer.memoryStorage()`)
- ⚠️ **Issue**: Multer uses memory storage, but chunks aren't being used currently

## Critical Issues for 10GB+ Files

### 1. S3 Single PUT Request Limit ⚠️ **CRITICAL**
- **AWS S3 Limit**: Maximum 5GB for single PUT request
- **Current Implementation**: Client uploads entire file in one PUT request (line 387-393 in `Upload.js`)
- **Problem**: Files over 5GB will fail with "EntityTooLarge" error
- **Solution Required**: Implement multipart upload for files > 5GB

### 2. Browser Memory Limitations
- **Issue**: Loading entire 10GB file into browser memory
- **Problem**: Browser may crash or become unresponsive
- **Solution Required**: Implement chunked uploads on client side

### 3. Network Timeout Issues
- **Issue**: Large uploads may timeout before completion
- **Problem**: Presigned URLs expire after 1 hour (line 169 in `upload.js`)
- **Solution Required**: 
  - Increase expiration for large files
  - Implement chunked uploads with retry logic

### 4. Presigned URL Expiration
- **Current**: 1 hour (3600 seconds)
- **Issue**: 10GB file upload may take longer than 1 hour on slower connections
- **Calculation**: 
  - 10GB / 1 hour = ~2.78 MB/s minimum required
  - On slower connections (< 2.78 MB/s), upload will fail

## Required Changes

### 1. Implement Multipart Upload for Files > 5GB
- Use AWS S3 multipart upload API
- Split files into 100MB chunks (minimum 5MB, maximum 5GB per part)
- Initiate multipart upload on server
- Upload each chunk with its own presigned URL
- Complete multipart upload after all chunks uploaded

### 2. Implement Chunked Upload on Client
- Read file in chunks (e.g., 100MB chunks)
- Upload chunks sequentially or in parallel (with limit)
- Show progress per chunk
- Handle retries for failed chunks

### 3. Update Server Configuration
- Increase Express body parser limits (for session creation, not file uploads)
- Update presigned URL expiration based on file size
- Implement multipart upload endpoints

### 4. Add Progress Tracking
- Track progress per chunk
- Handle resume for interrupted uploads
- Store chunk upload status in database

## Recommended Implementation

1. **Small Files (< 5GB)**: Continue using direct S3 PUT
2. **Large Files (≥ 5GB)**: Use S3 multipart upload
3. **Chunk Size**: 100MB chunks (balance between memory usage and upload speed)
4. **Parallelism**: Upload 3-5 chunks in parallel for faster uploads
5. **Presigned URL Expiration**: Calculate based on file size and connection speed

## S3 Limits Reference

- **Single PUT**: Maximum 5GB
- **Multipart Upload Part**: Minimum 5MB (except last part), Maximum 5GB
- **Multipart Upload Parts**: Maximum 10,000 parts
- **Maximum Object Size**: 5TB (using multipart)

## Testing Requirements

1. Test with 6GB file (should use multipart)
2. Test with 10GB file
3. Test with 15GB file
4. Test with slow connection (simulate timeout)
5. Test with interrupted upload (resume capability)
6. Test with multiple large files simultaneously

