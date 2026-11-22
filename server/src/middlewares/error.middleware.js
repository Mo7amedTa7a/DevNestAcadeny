const { env } = require('../config/env');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Global Express error-handling middleware.
 * Catches all errors forwarded via next(err) and returns a standardized JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, _req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;
  const errors = err.errors || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Database validation failed';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.AUTH_TOKEN_INVALID;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.AUTH_SESSION_EXPIRED;
    message = 'Token expired';
  }

  // Log unexpected errors in development
  if (!err.isOperational) {
    console.error('💥 UNEXPECTED ERROR:', err);
  }

  const response = {
    success: false,
    message,
    errorCode,
  };

  if (errors) response.errors = errors;

  // Include stack trace in development only
  if (env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorMiddleware };
