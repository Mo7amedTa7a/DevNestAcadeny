const { Router } = require('express');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { loginSchema } = require('./auth.validation');
const authController = require('./auth.controller');

const router = Router();

// POST /api/auth/login — Public
router.post('/login', validate({ body: loginSchema }), authController.login);

// POST /api/auth/refresh — Cookie-based (no Bearer token required)
router.post('/refresh', authController.refresh);

// POST /api/auth/logout — Requires valid access token
router.post('/logout', protect, authController.logout);

// GET /api/auth/me — Requires valid access token
router.get('/me', protect, authController.getMe);

module.exports = router;
