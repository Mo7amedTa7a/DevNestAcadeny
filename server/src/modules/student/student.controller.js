const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const studentService = require('./student.service');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await studentService.getStudentDashboard(req.user.id);
  sendSuccess(res, 'Student dashboard retrieved', data);
});

const getCourseLessons = asyncHandler(async (req, res) => {
  const lessons = await studentService.getCourseLessons(req.user.id, req.params.courseId);
  sendSuccess(res, 'Course lessons retrieved', { lessons });
});

const getSecureLesson = asyncHandler(async (req, res) => {
  const data = await studentService.getSecureLesson(
    req.user.id,
    req.params.id,
    req.user.sessionId
  );
  sendSuccess(res, 'Lesson data retrieved', data);
});

const resolveVideoToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const data = await studentService.resolveVideoToken(
    req.user.id,
    token,
    req.user.sessionId
  );
  sendSuccess(res, 'Video playback authorized', data);
});

const updateLessonProgress = asyncHandler(async (req, res) => {
  const data = await studentService.updateLessonProgress(
    req.user.id,
    req.params.id,
    req.body
  );
  sendSuccess(res, 'Lesson progress updated', data);
});

module.exports = {
  getDashboard,
  getCourseLessons,
  getSecureLesson,
  resolveVideoToken,
  updateLessonProgress,
};
