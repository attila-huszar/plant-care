import mjml2html from 'mjml'
import { env } from '@/config'
import { getEmailQueue } from '@/queues'
import { emailLogoContentId, jobOpts, QUEUE } from '@/constants'
import mfaOtp from '@/resources/emailTemplates/mfaOtp.mjml' with { type: 'text' }
import passwordReset from '@/resources/emailTemplates/passwordReset.mjml' with { type: 'text' }
import verification from '@/resources/emailTemplates/verification.mjml' with { type: 'text' }
import type {
  EmailJobType,
  MfaOtpEmailProps,
  PasswordResetEmailProps,
  SendEmailProps,
  VerificationEmailProps,
} from '@/types'

const baseLink = env.clientBaseUrl!

export class SendEmailPreconditionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SendEmailPreconditionError'
  }
}

export function sendEmail(
  type: typeof QUEUE.EMAIL.JOB.VERIFICATION,
  data: Omit<VerificationEmailProps, 'type'>,
): void
export function sendEmail(
  type: typeof QUEUE.EMAIL.JOB.PASSWORD_RESET,
  data: Omit<PasswordResetEmailProps, 'type'>,
): void
export function sendEmail(
  type: typeof QUEUE.EMAIL.JOB.MFA_OTP,
  data: Omit<MfaOtpEmailProps, 'type'>,
): void
export function sendEmail(type: EmailJobType, data: unknown): void {
  const emailQueue = getEmailQueue()

  switch (type) {
    case QUEUE.EMAIL.JOB.VERIFICATION: {
      const payload: VerificationEmailProps = {
        type,
        ...(data as Omit<VerificationEmailProps, 'type'>),
      }

      emailQueue.add(type, payload, jobOpts).catch((error: Error) => {
        console.error(
          '[QUEUE] Failed to queue registration verification email',
          {
            error,
            toAddress: payload.toAddress,
          },
        )
      })
      return
    }
    case QUEUE.EMAIL.JOB.PASSWORD_RESET: {
      const payload: PasswordResetEmailProps = {
        type,
        ...(data as Omit<PasswordResetEmailProps, 'type'>),
      }

      emailQueue.add(type, payload, jobOpts).catch((error: Error) => {
        console.error('[QUEUE] Failed to queue password reset email', {
          error,
          toAddress: payload.toAddress,
        })
      })
      return
    }
    case QUEUE.EMAIL.JOB.MFA_OTP: {
      const payload: MfaOtpEmailProps = {
        type,
        ...(data as Omit<MfaOtpEmailProps, 'type'>),
      }

      emailQueue.add(type, payload, jobOpts).catch((error: Error) => {
        console.error('[QUEUE] Failed to queue MFA OTP email', {
          error,
          toAddress: payload.toAddress,
        })
      })
      return
    }
  }
}

const interpolate = (template: string, vars: Record<string, string>) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => vars[key] ?? '')

export function getEmailHtml(props: SendEmailProps): string {
  switch (props.type) {
    case 'verification': {
      try {
        const { toName, tokenLink } = props
        const mjmlString = interpolate(verification, {
          toName: Bun.escapeHTML(toName),
          tokenLink,
          baseLink,
          cid: emailLogoContentId,
        })
        return mjml2html(mjmlString).html
      } catch (error) {
        console.error('Error generating verification email HTML', { error })
        throw error
      }
    }
    case 'passwordReset': {
      try {
        const { toName, tokenLink } = props
        const mjmlString = interpolate(passwordReset, {
          toName: Bun.escapeHTML(toName),
          tokenLink,
          baseLink,
          cid: emailLogoContentId,
        })
        return mjml2html(mjmlString).html
      } catch (error) {
        console.error('Error generating password reset email HTML', { error })
        throw error
      }
    }
    case 'mfaOtp': {
      try {
        const { toName, code } = props
        const mjmlString = interpolate(mfaOtp, {
          toName: Bun.escapeHTML(toName),
          code: Bun.escapeHTML(code),
          baseLink,
          cid: emailLogoContentId,
        })
        return mjml2html(mjmlString).html
      } catch (error) {
        console.error('Error generating MFA OTP email HTML', { error })
        throw error
      }
    }
    default:
      throw new Error('Unknown email type')
  }
}

const subjectMap: Record<EmailJobType, string> = {
  verification: 'Verify your email address',
  passwordReset: 'Forgotten Password',
  mfaOtp: 'Your login code',
}

export function getEmailSubject(props: SendEmailProps): string {
  return subjectMap[props.type]
}
