const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { ROLES } = require('../../utils/constants');
const {
  createTaskSchema,
  updateTaskSchema,
  gradeSubmissionSchema,
} = require('./tasks.validation');
const tasksController = require('./tasks.controller');

const router = Router();

// Protect ALL admin task routes
router.use(protect);
router.use(requireRole(ROLES.ADMIN));

router.get('/', tasksController.getAdminTasks);
router.post('/', validate({ body: createTaskSchema }), tasksController.createTask);
router.patch('/:id', validate({ body: updateTaskSchema }), tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);
router.get('/:id/submissions', tasksController.getTaskSubmissions);
router.post(
  '/submissions/:submissionId/grade',
  validate({ body: gradeSubmissionSchema }),
  tasksController.gradeSubmission
);

module.exports = router;
