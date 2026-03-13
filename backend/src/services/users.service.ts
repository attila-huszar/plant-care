import {
  type CreateCustomEventRequest,
  type CustomEventDto,
  type LoginRequest,
  type PasswordResetRequest,
  type PasswordResetSubmit,
  type PasswordResetToken,
  type PublicUser,
  type RegisterRequest,
  type VerificationRequest,
} from '@plant-care/shared'
import { env } from '@/config'
import { UsersRepository } from '@/repositories'
import {
  sendEmail,
  signAccessToken,
  signRefreshToken,
  toPublicUser,
} from '@/utils'
import { authMessage, userMessage } from '@/constants'
import { BadRequest, Forbidden, NotFound, Unauthorized } from '@/errors'
import type { UserInsert, UserUpdate } from '@/types'

export async function loginUser(loginRequest: LoginRequest) {
  const { email, password } = loginRequest

  const user = await UsersRepository.getUserBy('email', email)

  if (!user) {
    throw new Unauthorized(authMessage.authError)
  }

  if (!user.verified) {
    throw new Forbidden(userMessage.verifyFirst)
  }

  const isPasswordCorrect = await Bun.password.verify(password, user.password)

  if (!isPasswordCorrect) {
    throw new Unauthorized(authMessage.authError)
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const accessToken = await signAccessToken(user.uuid, timestamp)
  const refreshToken = await signRefreshToken(user.uuid, timestamp)

  return { accessToken, refreshToken, firstName: user.firstName }
}

export async function registerUser(registerRequest: RegisterRequest) {
  const { firstName, lastName, email, password } = registerRequest
  const existingUser = await UsersRepository.getUserBy('email', email)

  if (existingUser) {
    throw new BadRequest(userMessage.emailTaken)
  }

  const verificationToken = crypto.randomUUID()
  const verificationExpires = new Date(Date.now() + 86400000)
  const tokenLink = `${env.clientBaseUrl}/verification?token=${verificationToken}`

  const newUser: UserInsert = {
    uuid: crypto.randomUUID(),
    firstName,
    lastName,
    email,
    password: await Bun.password.hash(password),
    verified: false,
    verificationToken,
    verificationExpires,
    passwordResetToken: null,
    passwordResetExpires: null,
  }

  const userCreated = await UsersRepository.createUser(newUser)

  if (!userCreated) {
    throw new Error(userMessage.createError)
  }

  sendEmail('verification', {
    toAddress: email,
    toName: firstName,
    tokenLink,
  })

  return { email: userCreated.email }
}

export async function verifyUser(verificationRequest: VerificationRequest) {
  const { token } = verificationRequest

  const user = await UsersRepository.getUserBy('verificationToken', token)

  if (!user?.verificationToken) {
    throw new BadRequest(authMessage.invalidToken)
  }

  const expiry = user.verificationExpires

  if (expiry && new Date(expiry) < new Date()) {
    throw new BadRequest(authMessage.invalidToken)
  }

  const userUpdated = await UsersRepository.updateUserBy('email', user.email, {
    verified: true,
    verificationToken: null,
    verificationExpires: null,
  })

  if (!userUpdated) {
    throw new Error(userMessage.updateError)
  }

  return { email: userUpdated.email }
}

export async function passwordResetRequest(
  passwordResetRequest: PasswordResetRequest,
) {
  const { email } = passwordResetRequest

  const user = await UsersRepository.getUserBy('email', email)

  if (!user) {
    return { message: userMessage.forgotPasswordRequest }
  }

  const passwordResetToken = crypto.randomUUID()
  const passwordResetExpires = new Date(Date.now() + 86400000)
  const tokenLink = `${env.clientBaseUrl}/password-reset?token=${passwordResetToken}`

  const userUpdated = await UsersRepository.updateUserBy('email', user.email, {
    passwordResetToken,
    passwordResetExpires,
  })

  if (!userUpdated) {
    throw new Error(userMessage.updateError)
  }

  sendEmail('passwordReset', {
    toAddress: user.email,
    toName: user.firstName,
    tokenLink,
  })

  return { message: userMessage.forgotPasswordRequest }
}

export async function passwordResetToken(
  passwordResetToken: PasswordResetToken,
) {
  const { token } = passwordResetToken

  const user = await UsersRepository.getUserBy('passwordResetToken', token)

  if (!user?.passwordResetToken) {
    throw new BadRequest(authMessage.invalidToken)
  }

  return { token }
}

export async function passwordResetSubmit(
  passwordResetSubmit: PasswordResetSubmit,
) {
  const { token, password } = passwordResetSubmit

  const user = await UsersRepository.getUserBy('passwordResetToken', token)

  if (!user) {
    throw new NotFound(userMessage.getError)
  }

  const userUpdated = await UsersRepository.updateUserBy('email', user.email, {
    password: await Bun.password.hash(password),
    passwordResetToken: null,
    passwordResetExpires: null,
  })

  if (!userUpdated) {
    throw new Error(userMessage.updateError)
  }

  return { message: userMessage.passwordResetSuccess }
}

export async function getUserProfile(uuid: string): Promise<PublicUser>
export async function getUserProfile(
  uuid: string,
  options: { optional: true },
): Promise<PublicUser | null>
export async function getUserProfile(
  uuid: string,
  options?: { optional?: boolean },
): Promise<PublicUser | null> {
  const user = await UsersRepository.getUserBy('uuid', uuid)

  if (!user) {
    if (options?.optional) {
      return null
    }
    throw new NotFound(userMessage.getError)
  }

  return toPublicUser(user)
}

export async function updateUserProfile(
  uuid: string,
  updatePayload: UserUpdate,
): Promise<PublicUser> {
  const user = await UsersRepository.getUserBy('uuid', uuid)

  if (!user) {
    throw new NotFound(userMessage.getError)
  }

  if (updatePayload.password) {
    updatePayload.password = await Bun.password.hash(updatePayload.password)
  }

  const userUpdated = await UsersRepository.updateUserBy(
    'email',
    user.email,
    updatePayload,
  )

  if (!userUpdated) {
    throw new Error(userMessage.updateError)
  }

  return toPublicUser(userUpdated)
}

export async function getCustomEventTypes(
  uuid: string,
): Promise<CustomEventDto[]> {
  const user = await UsersRepository.getUserBy('uuid', uuid)

  if (!user) {
    throw new NotFound(userMessage.getError)
  }

  return user.customEvents ?? []
}

export async function upsertCustomEventType(
  uuid: string,
  payload: CreateCustomEventRequest,
): Promise<{ customEvent: CustomEventDto; created: boolean }> {
  const user = await UsersRepository.getUserBy('uuid', uuid)

  if (!user) {
    throw new NotFound(userMessage.getError)
  }

  const { name } = payload

  const existing = (user.customEvents ?? []).find(
    (t) => t.name.toLowerCase() === name.toLowerCase(),
  )
  if (existing) return { customEvent: existing, created: false }

  const customEvent: CustomEventDto = { id: crypto.randomUUID(), name }
  const customEventTypes = [...(user.customEvents ?? []), customEvent]

  const updated = await UsersRepository.updateUserBy('uuid', user.uuid, {
    customEvents: customEventTypes,
  })

  if (!updated) {
    throw new Error(userMessage.updateError)
  }

  return { customEvent, created: true }
}
