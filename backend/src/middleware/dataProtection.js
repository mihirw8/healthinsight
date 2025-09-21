/**
 * Data Protection Middleware
 * 
 * This middleware implements security features, data handling protocols,
 * and ensures proper data protection throughout the application.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Encrypts sensitive data before storing in database
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text
 */
function encryptSensitiveData(text) {
  try {
    if (!text) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production', 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts sensitive data retrieved from database
 * @param {string} encryptedText - Encrypted text
 * @returns {string} Decrypted text
 */
function decryptSensitiveData(encryptedText) {
  try {
    if (!encryptedText) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production', 'hex');
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Middleware to sanitize request inputs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeInputs(req, res, next) {
  try {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Basic XSS protection
          req.body[key] = req.body[key]
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        }
      });
    }
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key]
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
}

/**
 * Middleware to validate request data
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    if (!schema) return next();
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    next();
  };
}

/**
 * Middleware to log data access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function logDataAccess(req, res, next) {
  try {
    const userId = req.user?.id || 'unauthenticated';
    const accessType = req.method;
    const resourcePath = req.originalUrl;
    const timestamp = new Date();
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Log access to database
    prisma.accessLog.create({
      data: {
        userId,
        accessType,
        resourcePath,
        timestamp,
        ipAddress
      }
    }).catch(error => {
      console.error('Error logging data access:', error);
    });
    
    next();
  } catch (error) {
    console.error('Access logging error:', error);
    next(); // Continue even if logging fails
  }
}

/**
 * Middleware to add security headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function addSecurityHeaders(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  next();
}

/**
 * Middleware to redact sensitive information from responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function redactSensitiveData(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(body) {
    let modifiedBody = body;
    
    // If body is a string that looks like JSON, parse it
    if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
      try {
        const parsedBody = JSON.parse(body);
        
        // Redact sensitive fields
        const redactedBody = redactFields(parsedBody);
        
        modifiedBody = JSON.stringify(redactedBody);
      } catch (error) {
        // Not valid JSON, leave as is
      }
    }
    
    return originalSend.call(this, modifiedBody);
  };
  
  next();
}

/**
 * Helper function to redact sensitive fields in objects
 * @param {Object|Array} data - Data to redact
 * @returns {Object|Array} Redacted data
 */
function redactFields(data) {
  const sensitiveFields = [
    'password', 'ssn', 'socialSecurityNumber', 'creditCard', 'creditCardNumber',
    'cvv', 'pin', 'secret', 'accessToken', 'refreshToken'
  ];
  
  if (Array.isArray(data)) {
    return data.map(item => redactFields(item));
  }
  
  if (data && typeof data === 'object') {
    const result = { ...data };
    
    for (const key in result) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = redactFields(result[key]);
      }
    }
    
    return result;
  }
  
  return data;
}

/**
 * Middleware to enforce rate limiting
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per windowMs
    message = 'Too many requests, please try again later.'
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old requests
    for (const [key, timestamp] of requests.entries()) {
      if (now - timestamp > windowMs) {
        requests.delete(key);
      }
    }
    
    // Count requests for this IP
    const requestsForIP = Array.from(requests.entries())
      .filter(([key]) => key.startsWith(`${ip}:`))
      .length;
    
    if (requestsForIP >= max) {
      return res.status(429).json({
        success: false,
        message
      });
    }
    
    // Add this request
    const requestId = `${ip}:${now}`;
    requests.set(requestId, now);
    
    next();
  };
}

/**
 * Middleware to add medical disclaimer to responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function addMedicalDisclaimer(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(body) {
    let modifiedBody = body;
    
    // Only add disclaimer to successful responses with health data
    if (body && body.success && (
      body.healthReport || 
      body.biomarkers || 
      body.insights || 
      body.recommendations ||
      body.risks ||
      body.correlations
    )) {
      modifiedBody = {
        ...body,
        disclaimer: {
          medical: "The information provided is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
          accuracy: "Lab result interpretations are based on general reference ranges and may not account for individual variations or specific medical conditions. Consult with your healthcare provider before making any health-related decisions."
        }
      };
    }
    
    return originalJson.call(this, modifiedBody);
  };
  
  next();
}

/**
 * Middleware to anonymize data for research
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function anonymizeForResearch(req, res, next) {
  // Only apply to research endpoints
  if (!req.path.includes('/research')) {
    return next();
  }
  
  const originalJson = res.json;
  
  res.json = function(body) {
    let modifiedBody = body;
    
    if (body && Array.isArray(body.data)) {
      modifiedBody = {
        ...body,
        data: body.data.map(item => {
          // Remove identifying information
          const { id, userId, patientId, patientName, ...anonymized } = item;
          
          // Add research disclaimer
          return {
            ...anonymized,
            researchId: crypto.randomBytes(8).toString('hex'),
            researchDisclaimer: "This anonymized data is for research purposes only."
          };
        })
      };
    }
    
    return originalJson.call(this, modifiedBody);
  };
  
  next();
}

/**
 * Middleware to validate data integrity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateDataIntegrity(req, res, next) {
  // Only apply to endpoints that update data
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  try {
    // Check for required fields based on endpoint
    if (req.path.includes('/health-reports') && req.method === 'POST') {
      if (!req.body.userId || !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for health report upload'
        });
      }
    }
    
    // Check for data consistency
    if (req.path.includes('/biomarker-values') && (req.method === 'POST' || req.method === 'PUT')) {
      if (req.body.value && (isNaN(req.body.value) || req.body.value < 0)) {
        return res.status(400).json({
          success: false,
          message: 'Biomarker value must be a positive number'
        });
      }
      
      if (req.body.referenceMin && req.body.referenceMax && 
          parseFloat(req.body.referenceMin) > parseFloat(req.body.referenceMax)) {
        return res.status(400).json({
          success: false,
          message: 'Reference minimum cannot be greater than reference maximum'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Data integrity validation error:', error);
    return res.status(400).json({
      success: false,
      message: 'Data integrity validation failed'
    });
  }
}

module.exports = {
  encryptSensitiveData,
  decryptSensitiveData,
  sanitizeInputs,
  validateRequest,
  logDataAccess,
  addSecurityHeaders,
  redactSensitiveData,
  rateLimit,
  addMedicalDisclaimer,
  anonymizeForResearch,
  validateDataIntegrity
};