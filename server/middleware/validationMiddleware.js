const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Middleware to check express-validator validation result
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return next(new AppError('Validation failed. Please verify input data.', 422, errorDetails));
  }
  next();
};

module.exports = {
  validateRequest,
};
