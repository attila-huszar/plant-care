export const API_PATHS = {
  users: {
    login: '/users/login',
    logout: '/users/logout',
    refresh: '/users/refresh',
    register: '/users/register',
    verification: '/users/verification',
    passwordResetRequest: '/users/password-reset-request',
    passwordResetToken: '/users/password-reset-token',
    passwordResetSubmit: '/users/password-reset-submit',
    profile: '/users/profile',
    mfaVerify: '/users/mfa-verify',
  },
  plants: {
    root: '/plants',
    byId: '/plants/:id',
    events: '/plants/:plantId/events',
    eventById: '/plants/:plantId/events/:eventId',
    wildcard: '/plants/*',
  },
} as const

export const MIGRATIONS_DIR = './src/database/migrations'
export const MODELS_DIR = './src/models'
