import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUpload, FaFileVideo, FaSpinner, FaCheck, FaTimes, FaPlay } from 'react-icons/fa';
import api from '../services/api';

const UploadContainer = styled.div`
  padding: 40px 0;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 0 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 12px;
  color: white;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #999;
`;

const UploadSection = styled.div`
  background-color: #1a1a1a;
  border: 2px dashed #333;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  margin-bottom: 40px;
  transition: all 0.2s ease;
  
  ${props => props.$isDragActive && `
    border-color: #e50914;
    background-color: #2a1a1a;
  `}
  
  ${props => props.$isDragReject && `
    border-color: #e50914;
    background-color: #2a1a1a;
  `}
`;

const UploadIcon = styled.div`
  font-size: 64px;
  color: #666;
  margin-bottom: 20px;
  
  ${props => props.$isDragActive && `
    color: #e50914;
  `}
`;

const UploadText = styled.div`
  font-size: 18px;
  color: #ccc;
  margin-bottom: 12px;
`;

const UploadSubtext = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;


const UploadButton = styled.button`
  background-color: #e50914;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f40612;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const FileIcon = styled.div`
  font-size: 24px;
  color: #e50914;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
`;

const FileSize = styled.div`
  font-size: 14px;
  color: #999;
`;

const FileStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #333;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #e50914;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const ConversionSection = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ConversionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: white;
`;

const ConversionForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #999;
  font-weight: 500;
`;

const Input = styled.input`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 12px;
  color: white;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const TextArea = styled.textarea`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 12px;
  color: white;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const Select = styled.select`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 12px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  option {
    background-color: #333;
    color: white;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.$primary && `
    background-color: #e50914;
    color: white;
    
    &:hover {
      background-color: #f40612;
    }
    
    &:disabled {
      background-color: #666;
      cursor: not-allowed;
    }
  `}
  
  ${props => props.$secondary && `
    background-color: #333;
    color: white;
    border: 1px solid #555;
    
    &:hover {
      background-color: #444;
    }
  `}
`;

const StatusIcon = styled.div`
  font-size: 16px;
  
  ${props => props.$status === 'uploading' && `
    color: #e50914;
    animation: spin 1s linear infinite;
  `}
  
  ${props => props.$status === 'completed' && `
    color: #4CAF50;
  `}
  
  ${props => props.$status === 'error' && `
    color: #f44336;
  `}
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversionData, setConversionData] = useState({
    title: '',
    description: '',
    genre: '',
    year: new Date().getFullYear()
  });
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      error: null
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (rejectedFiles.length > 0) {
      console.error('Rejected files:', rejectedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv', '.webm']
    },
    maxSize: 10 * 1024 * 1024 * 1024, // 10GB
    multiple: true
  });

  const uploadMutation = useMutation(async ({ fileId, file, onProgress }) => {
    const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
    
    // Create upload session using API service
    const sessionData = await api.createUploadSession({
      filename: file.name,
      fileSize: file.size,
      contentType: file.type
    });
    const { sessionId, uploadUrl, useMultipart, chunkSize, numParts } = sessionData;

    if (useMultipart) {
      // Multipart upload for large files (>= 5GB)
      const parts = [];
      const numPartsToUpload = numParts || Math.ceil(file.size / (chunkSize || CHUNK_SIZE));
      
      for (let partNumber = 1; partNumber <= numPartsToUpload; partNumber++) {
        const start = (partNumber - 1) * (chunkSize || CHUNK_SIZE);
        const end = Math.min(start + (chunkSize || CHUNK_SIZE), file.size);
        const chunk = file.slice(start, end);
        
        // Get presigned URL for this part using API service
        const partUrlData = await api.getMultipartPartUrl(sessionId, partNumber);
        const partUrl = partUrlData.uploadUrl;
        
        // Upload chunk
        const uploadResponse = await fetch(partUrl, {
          method: 'PUT',
          body: chunk,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }
        
        // Get ETag from response
        const etag = uploadResponse.headers.get('ETag');
        if (!etag) {
          throw new Error(`No ETag received for part ${partNumber}`);
        }
        
        parts.push({
          PartNumber: partNumber,
          ETag: etag.replace(/"/g, '') // Remove quotes from ETag
        });
        
        // Update progress
        const progress = ((partNumber / numPartsToUpload) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      }
      
      // Complete multipart upload using API service
      const result = await api.completeUpload({ 
        sessionId,
        parts
      });
      return { success: true, s3Key: result.s3Key };
    } else {
      // Direct upload for small files (< 5GB)
      // Upload file to S3 using presigned URL with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // Complete the upload using API service
              const result = await api.completeUpload({ sessionId });
              resolve({ success: true, s3Key: result.s3Key });
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    }
  }, {
    onSuccess: (data, variables) => {
      setUploadedFiles(prev => prev.map(file => 
        file.id === variables.fileId 
          ? { ...file, status: 'completed', progress: 100, s3Key: data.s3Key }
          : file
      ));
    },
    onError: (error, variables) => {
      setUploadedFiles(prev => prev.map(file => 
        file.id === variables.fileId 
          ? { ...file, status: 'error', error: error.message }
          : file
      ));
    }
  });

  const convertMutation = useMutation(async ({ files, metadata }) => {
    // Call the conversion API using API service
    return api.createConversion({ files, metadata });
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('media');
      setUploadedFiles([]);
      setConversionData({
        title: '',
        description: '',
        genre: '',
        year: new Date().getFullYear()
      });
      alert('Conversion started successfully! Redirecting to conversions page...');
      navigate('/conversions');
    },
    onError: (error) => {
      alert('Conversion failed: ' + error.message);
    }
  });

  const handleUpload = async (fileItem) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileItem.id 
        ? { ...file, status: 'uploading', progress: 0 }
        : file
    ));

    try {
      await uploadMutation.mutateAsync({
        fileId: fileItem.id,
        file: fileItem.file,
        onProgress: (progress) => {
          setUploadedFiles(prev => prev.map(file => 
            file.id === fileItem.id 
              ? { ...file, progress }
              : file
          ));
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file first');
      return;
    }

    const completedFiles = uploadedFiles.filter(file => file.status === 'completed');
    if (completedFiles.length === 0) {
      alert('Please wait for files to finish uploading');
      return;
    }

    try {
      await convertMutation.mutateAsync({
        files: completedFiles.map(file => ({
          name: file.name,
          size: file.size,
          s3Key: file.s3Key
        })),
        metadata: conversionData
      });
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <FaSpinner />;
      case 'completed':
        return <FaCheck />;
      case 'error':
        return <FaTimes />;
      default:
        return <FaFileVideo />;
    }
  };

  return (
    <UploadContainer>
      <Header>
        <Title>Upload Media</Title>
        <Subtitle>Upload your video files and convert them for streaming</Subtitle>
      </Header>

      <UploadSection {...getRootProps()} $isDragActive={isDragActive} $isDragReject={isDragReject}>
        <input {...getInputProps()} />
        <UploadIcon $isDragActive={isDragActive}>
          <FaUpload />
        </UploadIcon>
        <UploadText>
          {isDragActive ? 'Drop your video files here' : 'Drag & drop video files here'}
        </UploadText>
        <UploadSubtext>
          or click to select files (MOV, MP4, AVI, MKV, WMV, FLV, WebM)
        </UploadSubtext>
        <UploadButton type="button">
          <FaUpload />
          Choose Files
        </UploadButton>
      </UploadSection>

      {uploadedFiles.length > 0 && (
        <FileList>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>Uploaded Files</h3>
          {uploadedFiles.map((fileItem) => (
            <FileItem key={fileItem.id}>
              <FileInfo>
                <FileIcon>
                  <FaFileVideo />
                </FileIcon>
                <FileDetails>
                  <FileName>{fileItem.name}</FileName>
                  <FileSize>{formatFileSize(fileItem.size)}</FileSize>
                  {fileItem.status === 'uploading' && (
                    <ProgressBar>
                      <ProgressFill progress={fileItem.progress} />
                    </ProgressBar>
                  )}
                </FileDetails>
              </FileInfo>
              <FileStatus>
                <StatusIcon $status={fileItem.status}>
                  {getStatusIcon(fileItem.status)}
                </StatusIcon>
                {fileItem.status === 'pending' && (
                  <Button 
                    onClick={() => handleUpload(fileItem)}
                    disabled={uploadMutation.isLoading}
                  >
                    Upload
                  </Button>
                )}
                {fileItem.status === 'error' && (
                  <Button 
                    $secondary
                    onClick={() => removeFile(fileItem.id)}
                  >
                    Remove
                  </Button>
                )}
              </FileStatus>
            </FileItem>
          ))}
        </FileList>
      )}

      <ConversionSection>
        <ConversionTitle>Media Information</ConversionTitle>
        <ConversionForm onSubmit={handleConvert}>
          <FormGroup>
            <Label>Title *</Label>
            <Input
              type="text"
              placeholder="Enter media title"
              value={conversionData.title}
              onChange={(e) => setConversionData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              placeholder="Enter media description"
              value={conversionData.description}
              onChange={(e) => setConversionData(prev => ({ ...prev, description: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Genre</Label>
            <Select
              value={conversionData.genre}
              onChange={(e) => setConversionData(prev => ({ ...prev, genre: e.target.value }))}
            >
              <option value="">Select Genre</option>
              <option value="Action">Action</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Horror">Horror</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Thriller">Thriller</option>
              <option value="Documentary">Documentary</option>
              <option value="Animation">Animation</option>
              <option value="Other">Other</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Year</Label>
            <Input
              type="number"
              placeholder="Release year"
              value={conversionData.year}
              onChange={(e) => setConversionData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </FormGroup>


          <ButtonGroup>
            <Button 
              type="button" 
              $secondary
              onClick={() => {
                setUploadedFiles([]);
                setConversionData({
                  title: '',
                  description: '',
                  genre: '',
                  year: new Date().getFullYear()
                });
              }}
            >
              Clear All
            </Button>
            <Button 
              type="submit" 
              $primary
              disabled={convertMutation.isLoading || uploadedFiles.filter(f => f.status === 'completed').length === 0}
            >
              {convertMutation.isLoading ? (
                <>
                  <FaSpinner />
                  Converting...
                </>
              ) : (
                <>
                  <FaPlay />
                  Start Conversion
                </>
              )}
            </Button>
          </ButtonGroup>
        </ConversionForm>
      </ConversionSection>
    </UploadContainer>
  );
}

export default Upload;
