const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { submitTaskSchema } = require('./tasks.validation');
const tasksController = require('./tasks.controller');

const router = Router();

// Student-facing tasks endpoints (requires active login)
router.use(protect);

router.get('/', tasksController.getStudentTasks);
router.post('/:id/submit', validate({ body: submitTaskSchema }), tasksController.submitTask);

module.exports = router;
