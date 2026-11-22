import api from '@/lib/axios';

/**
 * Auth API calls for DevNest Academy.
 */

/**
 * Login with email/studentCode + password.
 * @param {string} identifier - Email or student code
 * @param {string} password
 */
export const loginUser = async (identifier, password) => {
  const { data } = await api.post('/auth/login', { identifier, password });
  return data;
};

/**
 * Silent refresh — exchange HttpOnly refresh cookie for a new access token.
 */
export const refreshToken = async () => {
  const { data } = await api.post('/auth/refresh');
  return data;
};

/**
 * Logout — clear server session and refresh cookie.
 */
export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

/**
 * Get current authenticated user profile.
 */
export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};
