export const userMessage = {
  noSession: 'Session unavailable',
  verifyFirst: 'Please verify your email address before logging in',
  emailTaken: 'Email address is already registered',
  sendEmail: 'Error sending email',
  getError: 'Error getting user',
  createError: 'Error creating user',
  updateError: 'Error updating user',
  forgotPasswordRequest:
    "If you're registered with us, you'll receive a password reset link shortly",
  passwordResetSuccess: 'Password successfully reset',
} as const

export const authMessage = {
  authError: 'Email or password is incorrect',
  loginError: 'Login error',
  logoutError: 'Logout error',
  registerError: 'Register error',
  mfaDeliveryUnavailable:
    'MFA code delivery is temporarily unavailable. Please try again.',
  verifyError: 'Error verifying email',
  forgotPasswordError: 'Error sending password reset email',
  resetPasswordError: 'Error resetting password',
  verifyTokenError: 'Error verifying token',
  invalidToken: 'The token provided is either expired or invalid',
} as const

export const commonMessage = {
  fieldsRequired: 'Required fields missing',
  unknown: 'Unknown error occurred',
} as const
