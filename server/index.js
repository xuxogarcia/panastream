const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:", "http:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration
// Build allowed origins list
const allowedOrigins = [];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.APP_URL) {
  allowedOrigins.push(process.env.APP_URL);
}
// Always allow Fabricated Crime domain
allowedOrigins.push('https://your-domain.com', 'http://your-domain.com');
// Allow localhost for local testing (even in production)
if (process.env.ALLOW_LOCALHOST !== 'false') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001');
}

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log('[CORS] No origin header, allowing');
          return callback(null, true);
        }
        // Check if origin is in allowed list (exact match or starts with)
        const isAllowed = allowedOrigins.some(allowed => {
          const matches = origin === allowed || origin.startsWith(allowed);
          if (matches) {
            console.log(`[CORS] ✅ Allowing origin: ${origin} (matched: ${allowed})`);
          }
          return matches;
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          console.log(`[CORS] ❌ Blocking origin: ${origin} (not in allowed list)`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (thumbnails) with CORS headers
app.use('/thumbnails', express.static('public/thumbnails', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=3600');
  }
}));

// Route to serve uploaded files from S3 (proxy route)
app.get('/uploads/*', async (req, res) => {
  const { s3, s3Config } = require('./config/aws');
  // Get everything after /uploads/ from the path
  const s3Key = req.path.replace('/uploads/', '');
  
  try {
    const params = {
      Bucket: s3Config.bucket,
      Key: s3Key
    };
    
    // Get the object from S3
    const data = await s3.getObject(params).promise();
    
    // Set appropriate headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', data.ContentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=3600');
    
    // Send the file
    res.send(data.Body);
  } catch (error) {
    console.error('Error serving S3 file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in production
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// API Token Authentication Middleware
// Apply to all API routes except health check and static files
const authMiddleware = require('./middleware/auth');
app.use('/api', authMiddleware);

// Routes
app.use('/api/media', require('./routes/media'));
app.use('/api/library', require('./routes/library'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/convert', require('./routes/convert'));
app.use('/api/microsites', require('./routes/microsites'));
app.use('/api/filmmakers', require('./routes/filmmakers'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access from network: http://${getLocalIP()}:${PORT}`);
});

// Helper function to get local IP address
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
