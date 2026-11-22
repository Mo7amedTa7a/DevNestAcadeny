const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateProgressSchema, resolveVideoTokenSchema } = require('./student.validation');
const studentController = require('./student.controller');

const router = Router();

// Protect ALL student portal routes (must have valid JWT access token & active session)
router.use(protect);

// Dashboard overview
router.get('/dashboard', studentController.getDashboard);

// Course lessons playlist
router.get('/courses/:courseId/lessons', studentController.getCourseLessons);

// Secure lesson viewer (with encrypted token)
router.get('/lessons/:id', studentController.getSecureLesson);

// In-memory token resolution for player initialization
router.post(
  '/video/resolve',
  validate({ body: resolveVideoTokenSchema }),
  studentController.resolveVideoToken
);

// Progress tracking & Mark as completed
router.post(
  '/lessons/:id/progress',
  validate({ body: updateProgressSchema }),
  studentController.updateLessonProgress
);

module.exports = router;
