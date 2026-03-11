import nodemailer, { type SendMailOptions } from 'nodemailer'
import { env } from '@/config'
import { getEmailHtml, getEmailSubject } from '@/utils'
import {
  emailLogoContentId,
  emailLogoFilename,
  emailLogoFilePath,
  emailLogoMimeType,
  userMessage,
} from '@/constants'
import type { SendEmailProps } from '@/types'

const transportOptions = {
  service: env.mailerService,
  host: env.mailerHost,
  port: Number(env.mailerPort),
  secure: env.mailerSecure === 'true' ? true : false,
  auth: {
    user: env.mailerUser!,
    pass: env.mailerPass!,
  },
}

const transporter = nodemailer.createTransport(transportOptions)

transporter
  .verify()
  .then(() => {
    console.info('SMTP transporter verified')
  })
  .catch((error: unknown) => {
    console.error('SMTP transporter verification failed', error)
  })

const attachments = [
  {
    filename: emailLogoFilename,
    path: emailLogoFilePath,
    contentType: emailLogoMimeType,
    cid: emailLogoContentId,
  },
]

export async function sendMail(props: SendEmailProps) {
  try {
    const mailOptions: SendMailOptions = {
      from: `${env.mailerName} <${env.mailerUser!}>`,
      to: props.toAddress,
      subject: getEmailSubject(props),
      html: getEmailHtml(props),
      attachments,
    }

    return await transporter.sendMail(mailOptions)
  } catch (error) {
    throw new Error(userMessage.sendEmail, { cause: error })
  }
}
