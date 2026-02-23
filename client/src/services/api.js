import axios from 'axios';

// Dynamic API URL based on current host
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, use the same host as the frontend
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // Use current host with port 3001 for API in development
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = '3001';
  
  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Media API
export const mediaApi = {
  // Get all media with pagination and filters
  getMedia: (params = {}) => {
    return axiosInstance.get('/media', { params });
  },

  // Get media by ID
  getMediaById: (id) => {
    return axiosInstance.get(`/media/${id}`);
  },

  // Create new media item
  createMedia: (data) => {
    return axiosInstance.post('/media', data);
  },

  // Update media item
  updateMedia: (id, data) => {
    return axiosInstance.put(`/media/${id}`, data);
  },

  // Delete media item
  deleteMedia: (id) => {
    return axiosInstance.delete(`/media/${id}`);
  },

  // Get streaming URL
  getStreamUrl: (id) => {
    return axiosInstance.get(`/media/${id}/stream`);
  },

  // Search media
  searchMedia: (params) => {
    return axiosInstance.get('/library/search', { params });
  },
};

// Library API
export const libraryApi = {
  // Get library statistics
  getStats: () => {
    return axiosInstance.get('/library/stats');
  },

  // Get genres
  getGenres: () => {
    return axiosInstance.get('/library/genres');
  },

  // Get years
  getYears: () => {
    return axiosInstance.get('/library/years');
  },

  // Get recent media
  getRecent: (limit = 10) => {
    return axiosInstance.get('/library/recent', { params: { limit } });
  },
};

// Upload API
export const uploadApi = {
  // Create upload session
  createSession: (data) => {
    return axiosInstance.post('/upload/session', data);
  },

  // Upload file chunk
  uploadChunk: (formData) => {
    return axiosInstance.post('/upload/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Complete upload
  completeUpload: (data) => {
    return axiosInstance.post('/upload/complete', data);
  },

  // Get upload progress
  getProgress: (sessionId) => {
    return axiosInstance.get(`/upload/progress/${sessionId}`);
  },

  // Get presigned URL for multipart upload part
  getMultipartPartUrl: (sessionId, partNumber) => {
    return axiosInstance.post('/upload/multipart/part-url', {
      sessionId,
      partNumber
    });
  },
};

// Conversion API
export const conversionApi = {
  // Create conversion job (alias for start)
  create: (data) => {
    return axiosInstance.post('/convert/create', data);
  },

  // Start conversion job
  startJob: (data) => {
    return axiosInstance.post('/convert/start', data);
  },

  // Get job status
  getJobStatus: (jobId) => {
    return axiosInstance.get(`/convert/status/${jobId}`);
  },

  // List all jobs
  getJobs: (params = {}) => {
    return axiosInstance.get('/convert/jobs', { params });
  },

  // Cancel job
  cancelJob: (jobId) => {
    return axiosInstance.post(`/convert/cancel/${jobId}`);
  },

  // Poll job status
  pollStatus: (data) => {
    return axiosInstance.post('/convert/poll-status', data);
  },
};

// Combined API object for easy importing
export const api = {
  // Media operations
  getMedia: mediaApi.getMedia,
  getMediaById: mediaApi.getMediaById,
  createMedia: mediaApi.createMedia,
  updateMedia: mediaApi.updateMedia,
  deleteMedia: mediaApi.deleteMedia,
  getStreamUrl: mediaApi.getStreamUrl,
  searchMedia: mediaApi.searchMedia,

  // Library operations
  getLibraryStats: libraryApi.getStats,
  getGenres: libraryApi.getGenres,
  getYears: libraryApi.getYears,
  getRecentMedia: libraryApi.getRecent,

  // Upload operations
  createUploadSession: uploadApi.createSession,
  uploadChunk: uploadApi.uploadChunk,
  completeUpload: uploadApi.completeUpload,
  getUploadProgress: uploadApi.getProgress,
  getMultipartPartUrl: uploadApi.getMultipartPartUrl,

  // Conversion operations
  createConversion: conversionApi.create,
  startConversion: conversionApi.startJob,
  getConversionStatus: conversionApi.getJobStatus,
  getConversionJobs: conversionApi.getJobs,
  cancelConversion: conversionApi.cancelJob,
  pollConversionStatus: conversionApi.pollStatus,

  // File upload helper
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },
};

export default api;
