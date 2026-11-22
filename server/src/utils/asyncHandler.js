/**
 * Wraps an async Express route handler to automatically catch errors
 * and forward them to the global error middleware via next(err).
 * Eliminates repetitive try/catch blocks in controllers.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
