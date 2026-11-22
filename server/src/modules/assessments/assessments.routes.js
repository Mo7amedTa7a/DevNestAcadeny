const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  submitAnswersSchema,
  logViolationSchema,
} = require('./assessments.validation');
const assessmentsController = require('./assessments.controller');

const router = Router();

// Student assessment routes
router.use(protect);

router.get('/', assessmentsController.getStudentAssessments);
router.post('/:id/start', assessmentsController.startAssessmentAttempt);
router.post(
  '/:attemptId/violation',
  validate({ body: logViolationSchema }),
  assessmentsController.logViolation
);
router.post(
  '/:attemptId/submit',
  validate({ body: submitAnswersSchema }),
  assessmentsController.submitAssessmentAttempt
);
router.get('/:attemptId/review', assessmentsController.getAttemptReview);

module.exports = router;
