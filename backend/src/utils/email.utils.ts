import mjml2html from 'mjml'
import { env } from '@/config'
import { getEmailQueue } from '@/queues'
import { emailLogoContentId, jobOpts, QUEUE } from '@/constants'
import passwordReset from '@/resources/emailTemplates/passwordReset.mjml' with { type: 'text' }
import verification from '@/resources/emailTemplates/verification.mjml' with { type: 'text' }
import type {
  EmailJobType,
  PasswordResetEmailProps,
  SendEmailInput,
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

export function sendEmail(type: EmailJobType, data: SendEmailInput): void {
  const emailQueue = getEmailQueue()

  switch (type) {
    case QUEUE.EMAIL.JOB.VERIFICATION: {
      const payload: VerificationEmailProps = {
        type,
        ...data,
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
        ...data,
      }

      emailQueue.add(type, payload, jobOpts).catch((error: Error) => {
        console.error('[QUEUE] Failed to queue password reset email', {
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
    default:
      throw new Error('Unknown email type')
  }
}

const subjectMap: Record<EmailJobType, string> = {
  verification: 'Verify your email address',
  passwordReset: 'Forgotten Password',
}

export function getEmailSubject(props: SendEmailProps): string {
  return subjectMap[props.type]
}
