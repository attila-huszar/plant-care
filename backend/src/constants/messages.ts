export const userMessage = {
  noSession: 'Session unavailable',
  verifyFirst: 'Please verify your email address before logging in',
  emailTaken: 'Email address is already registered',
  emailSendFailed: 'We could not send the email right now. Please try again.',
  notFound: 'User account was not found.',
  createFailed: 'We could not create your account right now. Please try again.',
  updateFailed:
    'We could not save your account changes right now. Please try again.',
  forgotPasswordRequest:
    "If you're registered with us, you'll receive a password reset link shortly",
  passwordResetSuccess: 'Password successfully reset',
} as const

export const authMessage = {
  credentialsInvalid: 'Email or password is incorrect',
  mfaStateUpdateError:
    'We could not complete sign-in right now. Please try again.',
  logoutFailed: 'We could not sign you out right now. Please try again.',
  registerFailed:
    'We could not complete registration right now. Please try again.',
  mfaPendingRequired:
    'No MFA verification is pending for this account. Please sign in again.',
  mfaExpired: 'The OTP code has expired. Please sign in again.',
  mfaDeliveryUnavailable:
    'MFA code delivery is temporarily unavailable. Please try again.',
  mfaCodeError: 'The OTP code you entered is incorrect',
  verifyEmailFailed:
    'We could not verify your email right now. Please try again.',
  passwordResetRequestFailed:
    'We could not start password reset right now. Please try again.',
  passwordResetSubmitFailed:
    'We could not reset your password right now. Please try again.',
  tokenVerifyFailed:
    'We could not verify the token right now. Please try again.',
  invalidToken: 'The token provided is either expired or invalid',
} as const

export const commonMessage = {
  fieldsRequired: 'Required fields missing',
  unknown: 'Unknown error occurred',
} as const
