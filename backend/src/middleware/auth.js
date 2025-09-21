/**
 * Authentication Middleware
 * 
 * This middleware handles user authentication, authorization,
 * and session management for secure API access.
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function verifyToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
}

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
}

/**
 * Middleware to check if user is accessing their own resources
 * @param {string} paramName - Parameter name containing user ID
 * @returns {Function} Express middleware
 */
function isResourceOwner(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body[paramName];
    
    if (!req.user || (req.user.id !== resourceUserId && req.user.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
}

/**
 * Generates JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Generates refresh token for user
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Refreshes access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new tokens
    const accessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Middleware to handle optional authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuth(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue as unauthenticated
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (user) {
      // Add user to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }
    
    next();
  } catch (error) {
    // Token invalid, continue as unauthenticated
    next();
  }
}

/**
 * Middleware to check API key for external services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function verifyApiKey(req, res, next) {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Check if API key exists
    const validApiKey = await prisma.apiKey.findUnique({
      where: { key: apiKey }
    });
    
    if (!validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Check if API key is active
    if (!validApiKey.isActive) {
      return res.status(401).json({
        success: false,
        message: 'API key is inactive'
      });
    }
    
    // Add API key info to request
    req.apiKey = {
      id: validApiKey.id,
      name: validApiKey.name,
      permissions: validApiKey.permissions
    };
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying API key'
    });
  }
}

/**
 * Middleware to check permissions for API key
 * @param {Array} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
function hasApiPermissions(requiredPermissions) {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions) {
      return res.status(403).json({
        success: false,
        message: 'No permissions found'
      });
    }
    
    const apiKeyPermissions = JSON.parse(req.apiKey.permissions);
    
    // Check if API key has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      permission => apiKeyPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

module.exports = {
  verifyToken,
  isAdmin,
  isResourceOwner,
  generateToken,
  generateRefreshToken,
  refreshAccessToken,
  optionalAuth,
  verifyApiKey,
  hasApiPermissions
};