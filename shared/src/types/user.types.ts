import type z from 'zod'
import type {
  authJWTPayloadSchema,
  emailSchema,
  loginMfaPendingResponseSchema,
  loginResponseSchema,
  loginSchema,
  loginSuccessResponseSchema,
  mfaCodeSchema,
  mfaVerifyResponseSchema,
  passwordResetFormSchema,
  passwordResetRequestResponseSchema,
  passwordResetSchema,
  passwordResetSubmitResponseSchema,
  passwordResetTokenResponseSchema,
  publicUserSchema,
  refreshResponseSchema,
  registerFormSchema,
  registerResponseSchema,
  registerSchema,
  tokenSchema,
  userProfileUpdateSchema,
  verificationResponseSchema,
} from '../validation'

// Domain
export type AuthJWTPayload = z.infer<typeof authJWTPayloadSchema>
export type PublicUser = z.infer<typeof publicUserSchema>

// Requests
export type LoginRequest = z.infer<typeof loginSchema>
export type MfaVerifyRequest = z.infer<typeof mfaCodeSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type VerificationRequest = z.infer<typeof tokenSchema>
export type PasswordResetRequest = z.infer<typeof emailSchema>
export type PasswordResetToken = z.infer<typeof tokenSchema>
export type PasswordResetSubmit = z.infer<typeof passwordResetSchema>
export type UserProfileUpdateRequest = z.infer<typeof userProfileUpdateSchema>

// Forms
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type PasswordResetFormValues = z.infer<typeof passwordResetFormSchema>

// Responses
export type LoginMfaPendingResponse = z.infer<
  typeof loginMfaPendingResponseSchema
>
export type LoginSuccessResponse = z.infer<typeof loginSuccessResponseSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type MfaVerifyResponse = z.infer<typeof mfaVerifyResponseSchema>
export type RefreshResponse = z.infer<typeof refreshResponseSchema>
export type RegisterResponse = z.infer<typeof registerResponseSchema>
export type VerificationResponse = z.infer<typeof verificationResponseSchema>
export type PasswordResetRequestResponse = z.infer<
  typeof passwordResetRequestResponseSchema
>
export type PasswordResetTokenResponse = z.infer<
  typeof passwordResetTokenResponseSchema
>
export type PasswordResetSubmitResponse = z.infer<
  typeof passwordResetSubmitResponseSchema
>

export type UserProfileResponse = PublicUser
export type UserProfileUpdateResponse = PublicUser
