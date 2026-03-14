import type { QUEUE } from '@/constants'

export type QueueName = typeof QUEUE.EMAIL.NAME

export type EmailJobType =
  (typeof QUEUE.EMAIL.JOB)[keyof typeof QUEUE.EMAIL.JOB]

export type VerificationEmailProps = {
  type: 'verification'
  toAddress: string
  toName: string
  tokenLink: string
}

export type PasswordResetEmailProps = {
  type: 'passwordReset'
  toAddress: string
  toName: string
  tokenLink: string
}

export type MfaOtpEmailProps = {
  type: 'mfaOtp'
  toAddress: string
  toName: string
  code: string
}

export type SendEmailProps =
  | VerificationEmailProps
  | PasswordResetEmailProps
  | MfaOtpEmailProps

export type SendEmailInput = {
  toAddress: string
  toName: string
  tokenLink?: string
  code?: string
}
