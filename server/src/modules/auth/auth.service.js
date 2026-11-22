const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../../config/env');
const { AppError } = require('../../utils/AppError');
const { ERROR_CODES } = require('../../utils/constants');
const User = require('./auth.model');

/**
 * Authenticate a user by email or studentCode + password.
 * Generates a new session, issues access + refresh tokens.
 *
 * @param {string} identifier - Email or student code
 * @param {string} password - Plain-text password
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
const login = async (identifier, password) => {
  // Determine lookup field: student codes match DN-XX-XX-XXX pattern
  const isStudentCode = /^DN-/i.test(identifier);

  const query = isStudentCode
    ? { studentCode: identifier.toUpperCase() }
    : { email: identifier.toLowerCase() };

  const user = await User.findOne(query).select('+passwordHash +activeSessionId');

  if (!user) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 403, ERROR_CODES.AUTH_ACCOUNT_DISABLED);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  // Generate new session ID (invalidates any previous session — single-session enforcement)
  const sessionId = uuidv4();
  user.activeSessionId = sessionId;
  await user.save();

  // Issue tokens
  const accessToken = generateAccessToken(user, sessionId);
  const refreshToken = generateRefreshToken(user, sessionId);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using a valid refresh token.
 *
 * @param {string} refreshToken - JWT refresh token from HttpOnly cookie
 * @returns {{ user: object, accessToken: string }}
 */
const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token missing', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  const user = await User.findById(decoded.userId).select('+activeSessionId');

  if (!user || !user.isActive) {
    throw new AppError('Invalid refresh token', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  // Verify session is still active (not revoked by another login or logout)
  if (user.activeSessionId !== decoded.sessionId) {
    throw new AppError('Session has been revoked', 401, ERROR_CODES.AUTH_SESSION_REVOKED);
  }

  // Issue new access token (keep same session)
  const accessToken = generateAccessToken(user, decoded.sessionId);

  return {
    user: user.toJSON(),
    accessToken,
  };
};

/**
 * Logout — clear the user's active session.
 *
 * @param {string} userId
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { activeSessionId: null });
};

/**
 * Get current user profile (no sensitive fields).
 *
 * @param {string} userId
 * @returns {object} User document (sanitized via toJSON transform)
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }

  return user;
};

// ----- Token Helpers -----

function generateAccessToken(user, sessionId) {
  return jwt.sign(
    { userId: user._id, role: user.role, sessionId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user, sessionId) {
  return jwt.sign(
    { userId: user._id, sessionId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

module.exports = { login, refresh, logout, getMe };
