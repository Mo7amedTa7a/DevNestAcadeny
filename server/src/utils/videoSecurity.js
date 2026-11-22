const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('./AppError');
const { ERROR_CODES } = require('./constants');

/**
 * Generate a short-lived (15 minutes) signed video token.
 * This encapsulates the YouTube Video ID and binds it to the student's ID and active session.
 *
 * @param {string} videoId - YouTube Video ID (e.g. 'dQw4w9WgXcQ')
 * @param {string} userId
 * @param {string} sessionId
 * @returns {string} Encrypted/signed JWT token
 */
const generateVideoToken = (videoId, userId, sessionId) => {
  return jwt.sign(
    {
      vid: videoId,
      sub: userId,
      sid: sessionId,
      purpose: 'video_playback',
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Decrypt and verify a video token to retrieve the playback ID.
 * Validates that the token belongs to the requesting student and session.
 *
 * @param {string} token
 * @param {string} userId
 * @param {string} sessionId
 * @returns {string} YouTube Video ID
 */
const verifyVideoToken = (token, userId, sessionId) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
      decoded.purpose !== 'video_playback' ||
      decoded.sub !== userId.toString() ||
      decoded.sid !== sessionId
    ) {
      throw new AppError('توكن الفيديو غير صالح لهذه الجلسة', 403, ERROR_CODES.AUTH_FORBIDDEN);
    }

    return decoded.vid;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('انتهت صلاحية تشغيل الفيديو، يرجى تحديث الصفحة', 401, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
    throw new AppError('توكن الفيديو غير صالح', 403, ERROR_CODES.AUTH_TOKEN_INVALID);
  }
};

module.exports = {
  generateVideoToken,
  verifyVideoToken,
};
