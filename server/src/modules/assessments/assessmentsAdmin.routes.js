const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { ROLES } = require('../../utils/constants');
const {
  createAssessmentSchema,
  updateAssessmentSchema,
} = require('./assessments.validation');
const assessmentsController = require('./assessments.controller');

const router = Router();

// Protect ALL admin assessment routes
router.use(protect);
router.use(requireRole(ROLES.ADMIN));

router.get('/', assessmentsController.getAdminAssessments);
router.post('/', validate({ body: createAssessmentSchema }), assessmentsController.createAssessment);
router.patch('/:id', validate({ body: updateAssessmentSchema }), assessmentsController.updateAssessment);
router.delete('/:id', assessmentsController.deleteAssessment);
router.get('/:id/attempts', assessmentsController.getAssessmentAttempts);

module.exports = router;
