const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { ROLES } = require('../../utils/constants');
const {
  updateApplicantStatusSchema,
  approvePaymentSchema,
  createLessonSchema,
  updateLessonSchema,
} = require('./admin.validation');
const adminController = require('./admin.controller');

const router = Router();

// Protect ALL admin routes: must be authenticated and have role 'admin'
router.use(protect, requireRole(ROLES.ADMIN));

// Overview stats
router.get('/overview', adminController.getOverviewStats);

// Applicants & Registrations
router.get('/registrations', adminController.getApplicants);
router.get('/registrations/export-csv', adminController.exportApplicantsCsv);
router.patch(
  '/registrations/:id/status',
  validate({ body: updateApplicantStatusSchema }),
  adminController.updateApplicantStatus
);
router.post(
  '/registrations/:id/approve-payment',
  validate({ body: approvePaymentSchema }),
  adminController.approvePayment
);

// Course & Curriculum settings
router.get('/courses', adminController.getAllCoursesAdmin);
router.patch('/courses/:id', adminController.updateCourse);
router.patch('/courses/:id/toggle-registration', adminController.toggleCourseRegistration);

// Hero Announcement settings
router.get('/announcement', adminController.getAnnouncementSettings);
router.put('/announcement', adminController.updateAnnouncementSettings);

// Lessons (Drip release)
router.get('/courses/:courseId/lessons', adminController.getLessonsForCourse);
router.post('/lessons', validate({ body: createLessonSchema }), adminController.createLesson);
router.put('/lessons/:id', validate({ body: updateLessonSchema }), adminController.updateLesson);
router.patch('/lessons/:id/toggle-publish', adminController.togglePublishLesson);
router.delete('/lessons/:id', adminController.deleteLesson);

// Students & Sessions
router.get('/students', adminController.getStudents);
router.patch('/students/:id/reset-session', adminController.resetStudentSession);
router.patch('/students/:id/toggle-active', adminController.toggleStudentActive);

module.exports = router;
