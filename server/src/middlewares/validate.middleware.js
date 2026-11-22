const { AppError } = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Generic Zod validation middleware.
 * Validates req.body, req.params, and/or req.query against the provided schemas.
 *
 * @param {{ body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }} schemas
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post('/login', validate({ body: loginSchema }), controller.login);
 */
const validate = (schemas) => (req, _res, next) => {
  const errors = [];

  if (schemas.body) {
    const result = schemas.body.safeParse(req.body);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'body',
        }))
      );
    } else {
      req.body = result.data;
    }
  }

  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'params',
        }))
      );
    } else {
      req.params = result.data;
    }
  }

  if (schemas.query) {
    const result = schemas.query.safeParse(req.query);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'query',
        }))
      );
    } else {
      req.query = result.data;
    }
  }

  if (errors.length > 0) {
    return next(
      new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, errors)
    );
  }

  next();
};

module.exports = { validate };
