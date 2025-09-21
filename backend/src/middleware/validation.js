/**
 * Validation Middleware
 * 
 * This middleware provides validation schemas and functions for ensuring
 * data integrity and proper input validation throughout the application.
 */

const Joi = require('joi');

// User validation schemas
const userSchema = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    dateOfBirth: Joi.date().iso(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
    height: Joi.number().min(0),
    weight: Joi.number().min(0),
    medicalConditions: Joi.array().items(Joi.string()),
    medications: Joi.array().items(Joi.string())
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2),
    dateOfBirth: Joi.date().iso(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
    height: Joi.number().min(0),
    weight: Joi.number().min(0),
    medicalConditions: Joi.array().items(Joi.string()),
    medications: Joi.array().items(Joi.string())
  })
};

// Health report validation schemas
const healthReportSchema = {
  create: Joi.object({
    userId: Joi.string().required(),
    date: Joi.date().iso(),
    provider: Joi.string(),
    reportType: Joi.string().valid('blood', 'urine', 'imaging', 'other'),
    notes: Joi.string().max(1000)
  }),
  
  update: Joi.object({
    date: Joi.date().iso(),
    provider: Joi.string(),
    reportType: Joi.string().valid('blood', 'urine', 'imaging', 'other'),
    notes: Joi.string().max(1000)
  })
};

// Biomarker validation schemas
const biomarkerSchema = {
  create: Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    unit: Joi.string().required(),
    description: Joi.string(),
    normalRangeLow: Joi.number(),
    normalRangeHigh: Joi.number()
  }),
  
  update: Joi.object({
    name: Joi.string(),
    category: Joi.string(),
    unit: Joi.string(),
    description: Joi.string(),
    normalRangeLow: Joi.number(),
    normalRangeHigh: Joi.number()
  })
};

// Biomarker value validation schemas
const biomarkerValueSchema = {
  create: Joi.object({
    healthReportId: Joi.string().required(),
    biomarkerId: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    referenceMin: Joi.number(),
    referenceMax: Joi.number(),
    status: Joi.string().valid('normal', 'low', 'high', 'critical_low', 'critical_high')
  }),
  
  update: Joi.object({
    value: Joi.number(),
    unit: Joi.string(),
    referenceMin: Joi.number(),
    referenceMax: Joi.number(),
    status: Joi.string().valid('normal', 'low', 'high', 'critical_low', 'critical_high')
  }),
  
  batch: Joi.array().items(
    Joi.object({
      healthReportId: Joi.string().required(),
      biomarkerId: Joi.string().required(),
      value: Joi.number().required(),
      unit: Joi.string().required(),
      referenceMin: Joi.number(),
      referenceMax: Joi.number(),
      status: Joi.string().valid('normal', 'low', 'high', 'critical_low', 'critical_high')
    })
  )
};

// Symptom validation schemas
const symptomSchema = {
  create: Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    severity: Joi.number().integer().min(1).max(10),
    date: Joi.date().iso().required(),
    notes: Joi.string().max(500)
  }),
  
  update: Joi.object({
    name: Joi.string(),
    severity: Joi.number().integer().min(1).max(10),
    date: Joi.date().iso(),
    notes: Joi.string().max(500)
  })
};

// Medication validation schemas
const medicationSchema = {
  create: Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso(),
    notes: Joi.string().max(500)
  }),
  
  update: Joi.object({
    name: Joi.string(),
    dosage: Joi.string(),
    frequency: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    notes: Joi.string().max(500)
  })
};

// Recommendation validation schemas
const recommendationSchema = {
  create: Joi.object({
    userId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    priority: Joi.string().valid('high', 'medium', 'low').required(),
    source: Joi.string(),
    createdAt: Joi.date().iso()
  }),
  
  update: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    category: Joi.string(),
    priority: Joi.string().valid('high', 'medium', 'low'),
    source: Joi.string()
  })
};

// Risk assessment validation schemas
const riskAssessmentSchema = {
  create: Joi.object({
    userId: Joi.string().required(),
    riskName: Joi.string().required(),
    riskLevel: Joi.string().valid('low', 'moderate', 'high').required(),
    description: Joi.string().required(),
    biomarkers: Joi.string(),
    actionItems: Joi.string()
  }),
  
  update: Joi.object({
    riskLevel: Joi.string().valid('low', 'moderate', 'high'),
    description: Joi.string(),
    biomarkers: Joi.string(),
    actionItems: Joi.string()
  })
};

/**
 * Validates file uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateFileUpload(req, res, next) {
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'text/csv', 'application/json'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF, CSV, and JSON files are allowed.'
    });
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.'
    });
  }
  
  next();
}

/**
 * Validates date ranges
 * @param {string} startDateField - Start date field name
 * @param {string} endDateField - End date field name
 * @returns {Function} Express middleware
 */
function validateDateRange(startDateField, endDateField) {
  return (req, res, next) => {
    const startDate = req.query[startDateField] || req.body[startDateField];
    const endDate = req.query[endDateField] || req.body[endDateField];
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use ISO format (YYYY-MM-DD).'
        });
      }
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: `${startDateField} cannot be after ${endDateField}`
        });
      }
    }
    
    next();
  };
}

/**
 * Validates pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validatePagination(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be greater than or equal to 1'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  // Add pagination parameters to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
}

/**
 * Validates sorting parameters
 * @param {Array} allowedFields - Allowed fields for sorting
 * @returns {Function} Express middleware
 */
function validateSorting(allowedFields) {
  return (req, res, next) => {
    const { sortBy, sortOrder } = req.query;
    
    if (sortBy && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
      });
    }
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be either "asc" or "desc"'
      });
    }
    
    // Add sorting parameters to request
    if (sortBy) {
      req.sorting = {
        field: sortBy,
        order: (sortOrder || 'asc').toLowerCase()
      };
    }
    
    next();
  };
}

/**
 * Validates numerical range
 * @param {string} field - Field name
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Function} Express middleware
 */
function validateNumericalRange(field, min, max) {
  return (req, res, next) => {
    const value = req.body[field];
    
    if (value !== undefined) {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a number`
        });
      }
      
      if (min !== undefined && numValue < min) {
        return res.status(400).json({
          success: false,
          message: `${field} must be greater than or equal to ${min}`
        });
      }
      
      if (max !== undefined && numValue > max) {
        return res.status(400).json({
          success: false,
          message: `${field} must be less than or equal to ${max}`
        });
      }
    }
    
    next();
  };
}

/**
 * Validates biomarker reference ranges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateReferenceRanges(req, res, next) {
  const { referenceMin, referenceMax } = req.body;
  
  if (referenceMin !== undefined && referenceMax !== undefined) {
    const min = parseFloat(referenceMin);
    const max = parseFloat(referenceMax);
    
    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({
        success: false,
        message: 'Reference ranges must be numbers'
      });
    }
    
    if (min > max) {
      return res.status(400).json({
        success: false,
        message: 'Reference minimum cannot be greater than reference maximum'
      });
    }
  }
  
  next();
}

module.exports = {
  userSchema,
  healthReportSchema,
  biomarkerSchema,
  biomarkerValueSchema,
  symptomSchema,
  medicationSchema,
  recommendationSchema,
  riskAssessmentSchema,
  validateFileUpload,
  validateDateRange,
  validatePagination,
  validateSorting,
  validateNumericalRange,
  validateReferenceRanges
};