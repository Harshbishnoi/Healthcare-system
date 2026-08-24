const AppError = require('../utils/appError');

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - e.g. 'doctor', 'patient', 'admin'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
};
