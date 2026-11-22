const { AppError } = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Role-Based Access Control middleware.
 * Must be used AFTER protect middleware (requires req.user).
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'student')
 * @returns {Function} Express middleware
 *
 * @example
 *   router.get('/admin/stats', protect, requireRole('admin'), controller.getStats);
 */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new AppError(
        'You do not have permission to perform this action',
        403,
        ERROR_CODES.AUTH_FORBIDDEN
      )
    );
  }

  next();
};

module.exports = { requireRole };
