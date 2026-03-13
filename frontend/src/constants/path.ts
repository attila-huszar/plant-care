export const API_PATHS = {
  users: {
    login: '/users/login',
    logout: '/users/logout',
    refresh: '/users/refresh',
    register: '/users/register',
    profile: '/users/profile',
    verification: '/users/verification',
    passwordResetRequest: '/users/password-reset-request',
    passwordResetToken: '/users/password-reset-token',
    passwordResetSubmit: '/users/password-reset-submit',
    customEvents: '/users/custom-events',
  },
  plants: {
    root: '/plants',
    byId: (id: number) => `/plants/${id}`,
    events: (plantId: number) => `/plants/${plantId}/events`,
    eventById: (plantId: number, eventId: number) =>
      `/plants/${plantId}/events/${eventId}`,
  },
} as const
