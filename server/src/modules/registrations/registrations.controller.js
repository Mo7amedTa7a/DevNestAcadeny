const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const registrationsService = require('./registrations.service');

/**
 * @route   POST /api/registrations
 * @access  Public (Rate limited: 10 / 15m)
 */
const createRegistration = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

  const result = await registrationsService.createRegistration(req.body, ipAddress);

  sendSuccess(
    res,
    'تم تسجيل طلبك بنجاح! سنتواصل معك عبر واتساب لتأكيد الحجز وتفاصيل الدفع.',
    result,
    201
  );
});

module.exports = {
  createRegistration,
};
