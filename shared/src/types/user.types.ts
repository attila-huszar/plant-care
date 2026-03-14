import type z from 'zod'
import type {
  authJWTPayloadSchema,
  emailSchema,
  loginSchema,
  mfaCodeSchema,
  passwordResetSchema,
  publicUserSchema,
  registerFormSchema,
  registerSchema,
  tokenSchema,
  userProfileUpdateSchema,
} from '../validation'

export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type VerificationRequest = z.infer<typeof tokenSchema>
export type PasswordResetRequest = z.infer<typeof emailSchema>
export type PasswordResetToken = z.infer<typeof tokenSchema>
export type PasswordResetSubmit = z.infer<typeof passwordResetSchema>
export type AuthJWTPayload = z.infer<typeof authJWTPayloadSchema>
export type PublicUser = z.infer<typeof publicUserSchema>
export type UserProfileUpdateRequest = z.infer<typeof userProfileUpdateSchema>
export type MfaVerifyRequest = z.infer<typeof mfaCodeSchema>
