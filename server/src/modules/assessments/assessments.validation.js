const { z } = require('zod');
const { ASSESSMENT_TYPE } = require('../../utils/constants');

const questionValidationSchema = z.object({
  text: z.string().trim().min(3, 'نص السؤال مطلوب ولا يقل عن 3 أحرف'),
  codeSnippet: z.string().trim().optional().default(''),
  options: z
    .array(z.string().trim().min(1, 'الخيار لا يمكن أن يكون فارغاً'))
    .min(2, 'يجب توفير خيارين على الأقل'),
  correctOptionIndex: z.number().int().min(0, 'الفهرس الصحيح غير صالح'),
  points: z.number().int().min(1).max(100).default(10),
  explanation: z.string().trim().optional().default(''),
});

const createAssessmentSchema = z.object({
  courseId: z.string().trim().min(1, 'معرف الكورس مطلوب'),
  lessonId: z.string().trim().nullable().optional(),
  type: z.enum([ASSESSMENT_TYPE.QUIZ, ASSESSMENT_TYPE.EXAM]).default(ASSESSMENT_TYPE.EXAM),
  title: z.string().trim().min(3, 'عنوان الاختبار لا يقل عن 3 أحرف').max(200),
  description: z.string().trim().min(5, 'تفاصيل وتعليمات الاختبار مطلوبة'),
  durationMinutes: z.number().int().min(1, 'المدة لا تقل عن دقيقة').max(180),
  passingScore: z.number().min(0).max(100).default(70),
  strictAntiCheat: z.boolean().default(true),
  maxViolations: z.number().int().min(1).max(10).default(3),
  isPublished: z.boolean().default(true),
  questions: z.array(questionValidationSchema).min(1, 'يجب إضافة سؤال واحد على الأقل'),
});

const updateAssessmentSchema = createAssessmentSchema.partial().omit({ courseId: true });

const submitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().trim().min(1),
      selectedOptionIndex: z.number().int().nullable().optional(),
    })
  ),
});

const logViolationSchema = z.object({
  type: z.enum(['blur', 'fullscreen_exit', 'tab_switch', 'devtools_open', 'contextmenu_attempt']),
  notes: z.string().trim().max(200).optional().default(''),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitAnswersSchema,
  logViolationSchema,
};
