const { z } = require('zod');
const { REGISTRATION_STATUS, ACCESS_TYPES } = require('../../utils/constants');

const updateApplicantStatusSchema = z.object({
  status: z.enum(Object.values(REGISTRATION_STATUS)).optional(),
  adminNotes: z.string().optional(),
});

const approvePaymentSchema = z.object({
  accessType: z.enum(Object.values(ACCESS_TYPES)).default(ACCESS_TYPES.COHORT),
  initialPassword: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  adminNotes: z.string().optional(),
});

const createLessonSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف الكورس غير صالح'),
  moduleTitle: z.string().min(2, 'عنوان الموديل مطلوب').trim(),
  moduleNumber: z.coerce.number().min(1).default(1),
  title: z.string().min(2, 'عنوان المحاضرة مطلوب').trim(),
  order: z.coerce.number().min(1, 'ترتيب المحاضرة مطلوب'),
  youtubeVideoId: z.string().min(4, 'معرف فيديو يوتيوب مطلوب').trim(),
  duration: z.string().trim().default('1:30:00'),
  isPublished: z.boolean().default(false),
  releaseDate: z.coerce.date().nullable().optional(),
  description: z.string().optional().default(''),
  resources: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url('رابط الملحق غير صالح'),
        type: z.enum(['github', 'drive', 'pdf', 'link']).default('link'),
      })
    )
    .optional()
    .default([]),
});

const updateLessonSchema = createLessonSchema.partial();

module.exports = {
  updateApplicantStatusSchema,
  approvePaymentSchema,
  createLessonSchema,
  updateLessonSchema,
};
