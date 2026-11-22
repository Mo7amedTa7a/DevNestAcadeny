const { Router } = require('express');
const { validate } = require('../../middlewares/validate.middleware');
const { getCourseBySlugSchema } = require('./courses.validation');
const coursesController = require('./courses.controller');

const router = Router();

// GET /api/courses — Public list
router.get('/', coursesController.getAllCourses);

// GET /api/courses/announcement/active — Public hero announcement banner
const adminController = require('../admin/admin.controller');
router.get('/announcement/active', adminController.getPublicAnnouncement);

// GET /api/courses/:slug — Public course detail
router.get(
  '/:slug',
  validate({ params: getCourseBySlugSchema }),
  coursesController.getCourseBySlug
);

module.exports = router;
