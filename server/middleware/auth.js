// API Token Authentication Middleware
// Validates API token from Authorization header or X-API-Key header
// Public endpoints (signup, login) are excluded from authentication

module.exports = function(req, res, next) {
  // Public endpoints that don't require authentication
  // The middleware is applied to '/api', so req.path is relative to '/api'
  const method = req.method;
  const path = req.path; // Path after /api (e.g., '/filmmakers' or '/filmmakers/login')
  const originalUrl = req.originalUrl || req.url; // Full path (e.g., '/api/filmmakers')
  
  // Normalize path (remove trailing slash, handle query params)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '');
  
  // Public endpoint patterns (checking path after /api)
  const publicPathPatterns = [
    { method: 'POST', path: '/filmmakers' },                    // Signup/registration: POST /api/filmmakers
    { method: 'POST', path: '/filmmakers/login' },              // Login: POST /api/filmmakers/login
    { method: 'GET', path: '/filmmakers' },                     // List filmmakers: GET /api/filmmakers
    { method: 'GET', pathPattern: /^\/filmmakers\/slug\/.+$/ }, // Get by slug: GET /api/filmmakers/slug/:slug
  ];
  
  // Check if this is a public endpoint (check normalized path first)
  let isPublic = publicPathPatterns.some(pattern => {
    if (method !== pattern.method) return false;
    
    if (pattern.pathPattern) {
      return pattern.pathPattern.test(normalizedPath);
    }
    
    return normalizedPath === pattern.path;
  });
  
  // Fallback: also check originalUrl in case path matching doesn't work
  if (!isPublic) {
    isPublic = publicPathPatterns.some(pattern => {
      if (method !== pattern.method) return false;
      
      // Check against originalUrl (full path with /api)
      const fullPath = originalUrl.split('?')[0].replace(/\/$/, '');
      const expectedFullPath = `/api${pattern.path}`;
      
      if (pattern.pathPattern) {
        const fullPattern = new RegExp(`^/api${pattern.pathPattern.source}$`);
        return fullPattern.test(fullPath);
      }
      
      return fullPath === expectedFullPath;
    });
  }
  
  // Debug logging (always log to troubleshoot)
  console.log(`[Auth] ${method} ${normalizedPath} (full: ${originalUrl}) - Public: ${isPublic}`);
  
  // Allow public endpoints without authentication
  if (isPublic) {
    return next();
  }
  
  // Skip authentication in development if no token is configured
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const apiToken = process.env.PANASTREAM_API_TOKEN;
  
  // If no token is configured in development, allow all requests
  if (isDevelopment && !apiToken) {
    return next();
  }
  
  // If token is configured, require it
  if (apiToken) {
    // Check for token in Authorization header (Bearer token) or X-API-Key header
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    let providedToken = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedToken = authHeader.substring(7);
    } else if (apiKeyHeader) {
      providedToken = apiKeyHeader;
    }
    
    if (!providedToken || providedToken !== apiToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid API token required. Provide token in Authorization: Bearer <token> or X-API-Key header.'
      });
    }
  }
  
  next();
};

