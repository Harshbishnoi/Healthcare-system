const mongoose = require('mongoose');
const { verifyToken, extractTokenFromRequest } = require('../utils/jwtUtils');
const AppError = require('../utils/appError');
const User = require('../models/User');

/**
 * Protect routes: verifies JWT and attaches user to req.user
 */
const verifyAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return next(new AppError('Authentication required. Please log in to continue.', 401));
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // Check MongoDB if connected
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (e) {
        // Fallback to token payload
      }
    }

    if (!user && decoded) {
      // Use decoded token data if db not queryable
      user = {
        _id: decoded.id,
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
        city: decoded.city,
      };
    }

    req.user = {
      _id: user._id || user.id,
      id: (user._id || user.id).toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      city: user.city,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired or invalid authentication token.', 401));
    }
    next(error);
  }
};

module.exports = {
  verifyAuth,
};
