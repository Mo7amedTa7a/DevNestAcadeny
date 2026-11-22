const { z } = require('zod');

const updateProgressSchema = z.object({
  watchTimeSeconds: z.coerce.number().min(0).optional(),
  lastPositionSeconds: z.coerce.number().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

const resolveVideoTokenSchema = z.object({
  token: z.string().min(10, 'توكن الفيديو مطلوب'),
});

module.exports = {
  updateProgressSchema,
  resolveVideoTokenSchema,
};
