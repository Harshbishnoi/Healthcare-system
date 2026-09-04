const config = require('../config/env');

/**
 * Centralized Production-Grade Error Handling Middleware
 * Intercepts Operational, Database (Prisma/Mongoose), Validation, JWT, Multer, and System Errors.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413; // Payload Too Large
      message = 'Uploaded file exceeds the maximum allowed size limit (10MB).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      message = `Unexpected upload field: '${err.field}'. Please use the designated field name.`;
    } else {
      statusCode = 400;
      message = `File upload error: ${err.message}`;
    }
  }

  // Handle Malformed JSON payload SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON request body syntax.';
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    message = `Conflict: An entry with this ${field} already exists.`;
    details = err.keyValue;
  }

  // Handle Mongoose Schema Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Error in database document.';
    details = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  // Handle Prisma Relational errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Unique constraint violation in relational database.';
      details = { target: err.meta?.target };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Relational record not found.';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed in relational database.';
      details = { field: err.meta?.field_name };
    }
  }

  // Log error in development or if 500
  if (statusCode === 500 || config.env === 'development') {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl} - [${statusCode}] ${message}`);
    if (err.stack && statusCode === 500) {
      console.error(err.stack);
    }
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(details && { details }),
    ...(config.env === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
