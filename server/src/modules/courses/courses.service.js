const Course = require('./courses.model');
const { AppError } = require('../../utils/AppError');
const { ERROR_CODES } = require('../../utils/constants');

/**
 * Get all active courses (public summary).
 */
const getAllCourses = async () => {
  return Course.find({ isActive: true })
    .select(
      'title slug shortDescription description level duration price offerPrice hasOffer offerBadge offerEndsAt offerNote features guaranteeText whatsappSupportNumber currency isRegistrationOpen cohortName startDate thumbnail roadmap'
    )
    .sort({ createdAt: 1 })
    .lean();
};

/**
 * Get a single course by its unique slug.
 * @param {string} slug
 */
const getCourseBySlug = async (slug) => {
  const course = await Course.findOne({ slug: slug.toLowerCase(), isActive: true }).lean();

  if (!course) {
    throw new AppError('الكورس غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  return course;
};

module.exports = {
  getAllCourses,
  getCourseBySlug,
};
