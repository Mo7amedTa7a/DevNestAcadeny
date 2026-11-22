const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const adminService = require('./admin.service');

const getOverviewStats = asyncHandler(async (_req, res) => {
  const data = await adminService.getOverviewStats();
  sendSuccess(res, 'Overview stats retrieved', data);
});

const getApplicants = asyncHandler(async (req, res) => {
  const data = await adminService.getApplicants(req.query);
  sendSuccess(res, 'Applicants retrieved', data);
});

const updateApplicantStatus = asyncHandler(async (req, res) => {
  const applicant = await adminService.updateApplicantStatus(req.params.id, req.body);
  sendSuccess(res, 'Applicant status updated successfully', { applicant });
});

const approvePayment = asyncHandler(async (req, res) => {
  const result = await adminService.approvePaymentAndActivateStudent(req.params.id, req.body);
  sendSuccess(
    res,
    'تم تأكيد الدفع وتفعيل حساب الطالب وتوليد كود الدخول بنجاح!',
    result,
    200
  );
});

const exportApplicantsCsv = asyncHandler(async (req, res) => {
  const csvContent = await adminService.exportApplicantsCsv(req.query);
  const filename = `devnest-applicants-${new Date().toISOString().slice(0, 10)}.csv`;

  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment(filename);
  res.send(csvContent);
});

// Lessons
const getLessonsForCourse = asyncHandler(async (req, res) => {
  const lessons = await adminService.getLessonsForCourse(req.params.courseId);
  sendSuccess(res, 'Lessons retrieved', { lessons });
});

const createLesson = asyncHandler(async (req, res) => {
  const lesson = await adminService.createLesson(req.body);
  sendSuccess(res, 'تم إنشاء المحاضرة بنجاح', { lesson }, 201);
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await adminService.updateLesson(req.params.id, req.body);
  sendSuccess(res, 'تم تحديث المحاضرة بنجاح', { lesson });
});

const togglePublishLesson = asyncHandler(async (req, res) => {
  const lesson = await adminService.togglePublishLesson(req.params.id);
  const statusStr = lesson.isPublished ? 'منشورة الآن' : 'غير منشورة (مسودة)';
  sendSuccess(res, `تم تغيير حالة المحاضرة إلى: ${statusStr}`, { lesson });
});

const deleteLesson = asyncHandler(async (req, res) => {
  const result = await adminService.deleteLesson(req.params.id);
  sendSuccess(res, result.message);
});

// Course registration toggle
const toggleCourseRegistration = asyncHandler(async (req, res) => {
  const course = await adminService.toggleCourseRegistration(req.params.id);
  const statusStr = course.isRegistrationOpen ? 'مفتوح' : 'مغلق';
  sendSuccess(res, `تم تعديل حالة باب التسجيل إلى: ${statusStr}`, { course });
});

// Students
const getStudents = asyncHandler(async (_req, res) => {
  const students = await adminService.getStudents();
  sendSuccess(res, 'Students retrieved', { students });
});

const resetStudentSession = asyncHandler(async (req, res) => {
  const result = await adminService.resetStudentSession(req.params.id);
  sendSuccess(res, result.message);
});

const toggleStudentActive = asyncHandler(async (req, res) => {
  const student = await adminService.toggleStudentActive(req.params.id);
  const statusStr = student.isActive ? 'مفعل' : 'مجمد';
  sendSuccess(res, `تم تعديل حالة الحساب إلى: ${statusStr}`, { student });
});

// Announcement Settings
const getAnnouncementSettings = asyncHandler(async (_req, res) => {
  const announcement = await adminService.getAnnouncementSettings();
  sendSuccess(res, 'Announcement settings retrieved', { announcement });
});

const updateAnnouncementSettings = asyncHandler(async (req, res) => {
  const announcement = await adminService.updateAnnouncementSettings(req.body);
  sendSuccess(res, 'تم حفظ إعدادات إعلان الموقع بنجاح', { announcement });
});

const getPublicAnnouncement = asyncHandler(async (_req, res) => {
  const announcement = await adminService.getPublicAnnouncement();
  sendSuccess(res, 'Active announcement retrieved', { announcement });
});

// Admin Course & Content Management
const getAllCoursesAdmin = asyncHandler(async (_req, res) => {
  const courses = await adminService.getAllCoursesAdmin();
  sendSuccess(res, 'All courses retrieved', { courses });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await adminService.updateCourse(req.params.id, req.body);
  sendSuccess(res, 'تم تحديث بيانات ومنهج الكورس بنجاح', { course });
});

module.exports = {
  getOverviewStats,
  getApplicants,
  updateApplicantStatus,
  approvePayment,
  exportApplicantsCsv,
  getLessonsForCourse,
  createLesson,
  updateLesson,
  togglePublishLesson,
  deleteLesson,
  toggleCourseRegistration,
  getStudents,
  resetStudentSession,
  toggleStudentActive,
  getAnnouncementSettings,
  updateAnnouncementSettings,
  getPublicAnnouncement,
  getAllCoursesAdmin,
  updateCourse,
};
