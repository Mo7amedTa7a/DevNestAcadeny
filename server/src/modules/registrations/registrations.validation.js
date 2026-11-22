const { z } = require('zod');

const createRegistrationSchema = z.object({
  courseId: z
    .string({ required_error: 'Course ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID format'),
  fullName: z
    .string({ required_error: 'الاسم الكامل مطلوب' })
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً')
    .trim(),
  email: z
    .string({ required_error: 'البريد الإلكتروني مطلوب' })
    .email('صيغة البريد الإلكتروني غير صالحة')
    .trim()
    .toLowerCase(),
  phone: z
    .string({ required_error: 'رقم الهاتف/واتساب مطلوب' })
    .min(9, 'رقم الهاتف يجب أن يتكون من 9 أرقام على الأقل')
    .max(20, 'رقم الهاتف غير صالح')
    .trim(),
  age: z
    .coerce
    .number()
    .min(14, 'العمر يجب أن يكون 14 عاماً فأكثر')
    .max(70, 'العمر غير صالح')
    .optional(),
  background: z.string().max(200).optional().default(''),
  experienceLevel: z
    .enum(['beginner', 'some_basics', 'intermediate'], {
      errorMap: () => ({ message: 'يرجى اختيار مستوى الخبرة' }),
    })
    .default('beginner'),
  goals: z.string().max(500).optional().default(''),
  preferredPaymentMethod: z.string().max(50).optional().default('vodafone_cash'),
  referralSource: z.string().max(100).optional().default(''),
});

module.exports = {
  createRegistrationSchema,
};
