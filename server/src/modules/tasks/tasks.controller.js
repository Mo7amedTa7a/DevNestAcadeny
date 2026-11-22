const tasksService = require('./tasks.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

const getAdminTasks = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const tasks = await tasksService.getAdminTasks(courseId);
  sendSuccess(res, 'Admin tasks retrieved', { tasks });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await tasksService.createTask(req.body);
  sendSuccess(res, 'تم إنشاء المهمة بنجاح', { task }, 201);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTask(req.params.id, req.body);
  sendSuccess(res, 'تم تحديث المهمة بنجاح', { task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await tasksService.deleteTask(req.params.id);
  sendSuccess(res, result.message, result);
});

const getTaskSubmissions = asyncHandler(async (req, res) => {
  const data = await tasksService.getTaskSubmissions(req.params.id);
  sendSuccess(res, 'Task submissions retrieved', data);
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await tasksService.gradeSubmission(
    req.params.submissionId,
    req.body,
    req.user.id
  );
  sendSuccess(res, 'تم تقييم المهمة وحفظ الملاحظات بنجاح', { submission });
});

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

const getStudentTasks = asyncHandler(async (req, res) => {
  const data = await tasksService.getStudentTasks(req.user.id, req.query.courseId);
  sendSuccess(res, 'Student tasks retrieved', data);
});

const submitTask = asyncHandler(async (req, res) => {
  const submission = await tasksService.submitTask(
    req.user.id,
    req.params.id,
    req.body
  );
  sendSuccess(res, 'تم إرسال المهمة بنجاح وبانتظار مراجعة المدرب', { submission }, 201);
});

module.exports = {
  getAdminTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  gradeSubmission,
  getStudentTasks,
  submitTask,
};
