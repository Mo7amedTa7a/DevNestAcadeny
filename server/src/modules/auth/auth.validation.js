const { z } = require('zod');

/**
 * Login schema — accepts email OR studentCode as "identifier", plus password.
 */
const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or student code is required' })
    .min(1, 'Email or student code is required')
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = { loginSchema };
