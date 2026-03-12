import { z } from 'zod'

export const emailSchema = z.object({
  email: z
    .email('Invalid email')
    .trim()
    .transform((email) => email.toLowerCase()),
})

export const passwordSchema = z.object({
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*\d)/,
      'Password must contain at least one letter and one number',
    ),
})

export const tokenSchema = z.object({
  token: z.uuid('Invalid verification token'),
})

export const loginSchema = z.strictObject({
  ...emailSchema.shape,
  ...passwordSchema.shape,
})

export const registerSchema = z.object({
  firstName: z
    .string('First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string('Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  ...emailSchema.shape,
  ...passwordSchema.shape,
})

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z
      .string('Confirm password is required')
      .min(1, 'Confirm password is required'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const passwordResetSchema = z.strictObject({
  ...tokenSchema.shape,
  ...passwordSchema.shape,
})

export const authJWTPayloadSchema = z.looseObject({
  uuid: z.uuid('Invalid auth token uuid'),
  exp: z.number().optional(),
  iat: z.number().optional(),
})

export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type VerificationRequest = z.infer<typeof tokenSchema>
export type PasswordResetRequest = z.infer<typeof emailSchema>
export type PasswordResetToken = z.infer<typeof tokenSchema>
export type PasswordResetSubmit = z.infer<typeof passwordResetSchema>

export type AuthJWTPayload = z.infer<typeof authJWTPayloadSchema>
