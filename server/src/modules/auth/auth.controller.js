const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const authService = require('./auth.service');

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login(identifier, password);

  // Set refresh token as HttpOnly cookie
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, 'Login successful', { user, accessToken });
});

/**
 * @route   POST /api/auth/refresh
 * @access  Cookie (HttpOnly refresh token)
 */
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const { user, accessToken } = await authService.refresh(refreshToken);

  sendSuccess(res, 'Token refreshed', { user, accessToken });
});

/**
 * @route   POST /api/auth/logout
 * @access  Authenticated
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth/refresh',
  });

  sendSuccess(res, 'Logged out successfully');
});

/**
 * @route   GET /api/auth/me
 * @access  Authenticated
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  sendSuccess(res, 'User profile retrieved', { user });
});

// ----- Helpers -----

function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

module.exports = { login, refresh, logout, getMe };
