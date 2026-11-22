const Registration = require('./registrations.model');
const Course = require('../courses/courses.model');
const { AppError } = require('../../utils/AppError');
const { ERROR_CODES, REGISTRATION_STATUS } = require('../../utils/constants');

/**
 * Submit a course registration form.
 *
 * Checks:
 * 1. Course exists and is active.
 * 2. Course has isRegistrationOpen === true.
 * 3. Prevents duplicate submissions for the same course + email if already registered.
 *
 * @param {object} data
 * @param {string} ipAddress
 */
const createRegistration = async (data, ipAddress = null) => {
  const course = await Course.findById(data.courseId);

  if (!course || !course.isActive) {
    throw new AppError('الكورس المطلوب غير متاح حالياً', 404, ERROR_CODES.NOT_FOUND);
  }

  if (!course.isRegistrationOpen) {
    throw new AppError(
      'عذراً، باب التسجيل مغلق حالياً لهذه الدفعة. يمكنك متابعتنا للإعلان عن الدفعة القادمة.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if a pending or approved registration already exists with this email/phone
  const existingRegistration = await Registration.findOne({
    courseId: course._id,
    $or: [{ email: data.email }, { phone: data.phone }],
    status: { $in: [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.CONTACTED, REGISTRATION_STATUS.APPROVED] },
  });

  if (existingRegistration) {
    throw new AppError(
      'تم إرسال طلب تسجيل مسبقاً بهذا البريد الإلكتروني أو رقم الهاتف لهذه الدفعة. سنتواصل معك قريباً عبر واتساب!',
      409,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const registration = await Registration.create({
    ...data,
    ipAddress,
  });

  return {
    registrationId: registration._id,
    fullName: registration.fullName,
    courseTitle: course.title,
    cohortName: course.cohortName,
  };
};

module.exports = {
  createRegistration,
};
