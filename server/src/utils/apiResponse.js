/**
 * Standardized API response builders.
 * Ensures every endpoint returns a consistent JSON shape.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {object} [data]
 * @param {number} [statusCode=200]
 * @param {object} [meta] - Optional pagination/meta info
 */
const sendSuccess = (res, message, data = null, statusCode = 200, meta = null) => {
  const response = { success: true, message };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {string} [errorCode]
 * @param {Array} [errors]
 */
const sendError = (res, message, statusCode = 500, errorCode = null, errors = null) => {
  const response = { success: false, message };

  if (errorCode) response.errorCode = errorCode;
  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
