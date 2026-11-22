const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { validate } = require('../../middlewares/validate.middleware');
const { createRegistrationSchema } = require('./registrations.validation');
const { RATE_LIMITS } = require('../../utils/constants');
const registrationsController = require('./registrations.controller');

const router = Router();

// Strict rate limiter for registration submissions
const registrationLimiter = rateLimit({
  windowMs: RATE_LIMITS.REGISTRATION.windowMs,
  max: RATE_LIMITS.REGISTRATION.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم إرسال عدد كبير من الطلبات من هذا الجهاز. يرجى المحاولة بعد قليل.',
  },
});

// POST /api/registrations — Public submission
router.post(
  '/',
  registrationLimiter,
  validate({ body: createRegistrationSchema }),
  registrationsController.createRegistration
);

module.exports = router;
