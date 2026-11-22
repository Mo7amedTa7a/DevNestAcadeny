const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const coursesService = require('./courses.service');

/**
 * @route   GET /api/courses
 * @access  Public
 */
const getAllCourses = asyncHandler(async (_req, res) => {
  const courses = await coursesService.getAllCourses();
  sendSuccess(res, 'Courses retrieved successfully', { courses });
});

/**
 * @route   GET /api/courses/:slug
 * @access  Public
 */
const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseBySlug(req.params.slug);
  sendSuccess(res, 'Course details retrieved successfully', { course });
});

module.exports = {
  getAllCourses,
  getCourseBySlug,
};
