const assessmentsService = require('./assessments.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

const getAdminAssessments = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const assessments = await assessmentsService.getAdminAssessments(courseId);
  sendSuccess(res, 'Admin assessments retrieved', { assessments });
});

const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.createAssessment(req.body);
  sendSuccess(res, 'تم إنشاء الاختبار بنجاح', { assessment }, 201);
});

const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.updateAssessment(req.params.id, req.body);
  sendSuccess(res, 'تم تحديث الاختبار بنجاح', { assessment });
});

const deleteAssessment = asyncHandler(async (req, res) => {
  const result = await assessmentsService.deleteAssessment(req.params.id);
  sendSuccess(res, result.message, result);
});

const getAssessmentAttempts = asyncHandler(async (req, res) => {
  const data = await assessmentsService.getAssessmentAttempts(req.params.id);
  sendSuccess(res, 'Assessment attempts retrieved', data);
});

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

const getStudentAssessments = asyncHandler(async (req, res) => {
  const data = await assessmentsService.getStudentAssessments(req.user.id, req.query.courseId);
  sendSuccess(res, 'Student assessments retrieved', data);
});

const startAssessmentAttempt = asyncHandler(async (req, res) => {
  const data = await assessmentsService.startAssessmentAttempt(req.user.id, req.params.id);
  sendSuccess(res, 'Assessment attempt initialized', data);
});

const logViolation = asyncHandler(async (req, res) => {
  const data = await assessmentsService.logViolation(
    req.user.id,
    req.params.attemptId,
    req.body
  );
  sendSuccess(res, 'Anti-cheat violation processed', data);
});

const submitAssessmentAttempt = asyncHandler(async (req, res) => {
  const data = await assessmentsService.submitAssessmentAttempt(
    req.user.id,
    req.params.attemptId,
    req.body
  );
  sendSuccess(res, 'تم تسليم الاختبار وتصحيحه بنجاح', data);
});

const getAttemptReview = asyncHandler(async (req, res) => {
  const data = await assessmentsService.getAttemptReview(req.user.id, req.params.attemptId);
  sendSuccess(res, 'Attempt review retrieved', data);
});

module.exports = {
  getAdminAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentAttempts,
  getStudentAssessments,
  startAssessmentAttempt,
  logViolation,
  submitAssessmentAttempt,
  getAttemptReview,
};
