const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const { ERROR_CODES } = require('../utils/constants');
const User = require('../modules/auth/auth.model');

/**
 * Protect middleware — verifies JWT access token and enforces single active session.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT signature and extract payload
 * 3. Load user from DB, reject if disabled
 * 4. Compare token's sessionId with user's activeSessionId (single-session enforcement)
 * 5. Attach req.user = { id, role, sessionId }
 */
const protect = asyncHandler(async (req, _res, next) => {
  // 1. Extract token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, ERROR_CODES.AUTH_TOKEN_MISSING);
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    // Let the error middleware handle JsonWebTokenError / TokenExpiredError
    throw error;
  }

  // 3. Load user
  const user = await User.findById(decoded.userId).select('+activeSessionId');

  if (!user) {
    throw new AppError('User no longer exists', 401, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 403, ERROR_CODES.AUTH_ACCOUNT_DISABLED);
  }

  // 4. Single-session enforcement
  if (user.activeSessionId !== decoded.sessionId) {
    throw new AppError(
      'Session revoked — logged in from another device',
      401,
      ERROR_CODES.AUTH_SESSION_REVOKED
    );
  }

  // 5. Attach user to request
  req.user = {
    id: user._id,
    role: user.role,
    sessionId: decoded.sessionId,
  };

  next();
});

module.exports = { protect };
