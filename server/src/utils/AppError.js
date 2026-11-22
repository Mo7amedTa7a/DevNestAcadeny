const { ERROR_CODES } = require('./constants');

/**
 * Custom operational error class for predictable, handled errors.
 * Non-operational errors (programming bugs) are caught by the global error handler.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [errorCode] - Machine-readable error code from ERROR_CODES
   * @param {Array} [errors] - Optional array of field-level validation errors
   */
  constructor(message, statusCode, errorCode = ERROR_CODES.INTERNAL_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
