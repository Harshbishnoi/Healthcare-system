const config = require('../config/env');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

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

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Unique constraint failed in relational database.';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Relational record not found.';
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
    message,
    ...(details && { details }),
    ...(config.env === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
