const Enrollment = require('../modules/enrollments/enrollments.model');
const { AppError } = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const { ERROR_CODES, ENROLLMENT_STATUS, ROLES } = require('../utils/constants');

/**
 * Enrollment verification middleware.
 * Verifies that the authenticated student has an active enrollment record for the course.
 * Admins automatically bypass this check.
 *
 * @param {string} courseIdParam - The req.params key containing the courseId
 * @returns {Function} Express middleware
 */
const requireEnrollment = (courseIdParam = 'courseId') =>
  asyncHandler(async (req, _res, next) => {
    // Admin bypasses course enrollment gating
    if (req.user && req.user.role === ROLES.ADMIN) {
      return next();
    }

    const courseId = req.params[courseIdParam] || req.body[courseIdParam];

    if (!courseId) {
      throw new AppError('معرف الكورس مطلوب للتحقق من الاشتراك', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).lean();

    if (!enrollment) {
      throw new AppError(
        'عذراً، لا تمتلك اشتراكاً فعالاً في هذا الكورس للوصول إلى المحتوى',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }

    // Attach enrollment to request for downstream tier and feature checks
    req.enrollment = enrollment;
    next();
  });

/**
 * Enrollment feature-flag middleware.
 * Checks that the student's enrollment tier permits the requested cohort feature.
 *
 * @param {string} featureKey - One of: 'canAccessTasks', 'canAccessExams', 'showInLeaderboard'
 * @returns {Function} Express middleware
 */
const requireFeature = (featureKey) => (req, _res, next) => {
  // Admin bypass
  if (req.user && req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (!req.enrollment || !req.enrollment.features) {
    return next(
      new AppError('بيانات الاشتراك غير متوفرة', 403, ERROR_CODES.ENROLLMENT_REQUIRED)
    );
  }

  if (!req.enrollment.features[featureKey]) {
    return next(
      new AppError(
        'هذه الميزة متاحة فقط لطلاب الدفعة التفاعلية (Cohort) وغير مفعلة لاشتراكات المحتوى المسجل فقط',
        403,
        ERROR_CODES.ENROLLMENT_FEATURE_DENIED
      )
    );
  }

  next();
};

module.exports = { requireEnrollment, requireFeature };
