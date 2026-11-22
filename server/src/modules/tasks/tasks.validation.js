const { z } = require('zod');
const { SUBMISSION_STATUS } = require('../../utils/constants');

// Strict URL regex patterns for security (OWASP anti-cheat/injection)
const GITHUB_REPO_REGEX = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/;
const GOOGLE_DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/(drive|document|file|folderview|open)\?.*|^https:\/\/(drive|docs)\.google\.com\/(drive\/folders|file\/d|document\/d)\/[a-zA-Z0-9_-]+.*$/;

const createTaskSchema = z.object({
  courseId: z.string().trim().min(1, 'معرف الكورس مطلوب'),
  title: z.string().trim().min(3, 'عنوان المهمة لا يقل عن 3 أحرف').max(200),
  moduleNumber: z.number().int().min(1, 'رقم الوحدة غير صالح'),
  moduleTitle: z.string().trim().optional().default(''),
  description: z.string().trim().min(10, 'تفاصيل المهمة مطلوبة ولا تقل عن 10 أحرف'),
  requirements: z.array(z.string().trim()).optional().default([]),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'تاريخ التسليم غير صالح',
  }),
  maxScore: z.number().int().min(1).max(1000).default(100),
  allowedLinkTypes: z.array(z.enum(['github', 'drive'])).min(1).default(['github', 'drive']),
  isActive: z.boolean().optional().default(true),
});

const updateTaskSchema = createTaskSchema.partial().omit({ courseId: true });

const submitTaskSchema = z.object({
  submissionUrl: z
    .string()
    .trim()
    .url('رابط التسليم غير صالح')
    .refine((url) => {
      // Must be https only
      if (!url.startsWith('https://')) return false;
      // Must strictly match either GitHub or Google Drive
      return GITHUB_REPO_REGEX.test(url) || GOOGLE_DRIVE_REGEX.test(url);
    }, {
      message: 'يجب أن يكون الرابط مستودع GitHub عام أو ملف Google Drive متاح للعرض (HTTPS فقط)',
    }),
  notes: z.string().trim().max(1000, 'الملاحظات لا تتجاوز 1000 حرف').optional().default(''),
});

const gradeSubmissionSchema = z.object({
  score: z.number().min(0, 'الدرجة لا يمكن أن تكون سالبة'),
  feedback: z.string().trim().min(3, 'ملاحظات المراجعة مطلوبة للمساعدة في التطور').max(3000),
  status: z.enum([SUBMISSION_STATUS.REVIEWED, SUBMISSION_STATUS.NEEDS_REVISION]),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  submitTaskSchema,
  gradeSubmissionSchema,
  GITHUB_REPO_REGEX,
  GOOGLE_DRIVE_REGEX,
};
