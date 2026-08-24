const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  static async registerPatient(req, res, next) {
    try {
      const result = await AuthService.registerPatient(req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return ApiResponse.created(res, result, 'Patient registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async registerDoctor(req, res, next) {
    try {
      const result = await AuthService.registerDoctor(req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return ApiResponse.created(res, result, 'Doctor registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return ApiResponse.success(res, result, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const result = await AuthService.getMe(req.user.id);
      return ApiResponse.success(res, result, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // In stateless JWT, logout is handled by client token removal or token blacklisting
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
