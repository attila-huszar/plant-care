import { z } from 'zod'
import { customEventDtoSchema } from './diarySchemas'

export const emailSchema = z.object({
  email: z
    .email('Invalid email')
    .trim()
    .transform((email) => email.toLowerCase()),
})

const firstNameSchema = z
  .string('First name is required')
  .max(100, 'First name must be less than 100 characters')

const lastNameSchema = z
  .string('Last name is required')
  .max(100, 'Last name must be less than 100 characters')

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
  firstName: firstNameSchema,
  lastName: lastNameSchema,
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

export const userProfileUpdateSchema = z
  .strictObject({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: emailSchema.shape.email.optional(),
    password: passwordSchema.shape.password.optional(),
    mfaEnabled: z.boolean().optional(),
    customEvents: z.array(customEventDtoSchema).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  })

export const mfaCodeSchema = z.strictObject({
  ...emailSchema.shape,
  code: z
    .string('Code is required')
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numeric'),
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

export const publicUserSchema = z.strictObject({
  uuid: z.uuid('Invalid user uuid'),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  mfaEnabled: z.boolean(),
  customEvents: z.array(customEventDtoSchema),
})
