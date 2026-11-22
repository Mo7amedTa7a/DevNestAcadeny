const { z } = require('zod');

const getCourseBySlugSchema = z.object({
  slug: z.string().min(1, 'Course slug is required').trim(),
});

module.exports = {
  getCourseBySlugSchema,
};
