import { randomInt } from 'node:crypto'
import {
  type LoginRequest,
  type MfaVerifyRequest,
  type PasswordResetRequest,
  type PasswordResetSubmit,
  type PasswordResetToken,
  type PublicUser,
  type RegisterRequest,
  type UserProfileUpdateRequest,
  type VerificationRequest,
} from '@plant-care/shared'
import status from 'http-status'
import { env } from '@/config'
import { UsersRepository } from '@/repositories'
import {
  sendEmail,
  signAccessToken,
  signRefreshToken,
  toPublicUser,
} from '@/utils'
import { authMessage, userMessage } from '@/constants'
import {
  BadRequest,
  Forbidden,
  Internal,
  NotFound,
  Unauthorized,
} from '@/errors'
import type { UserInsertRow, UserUpdateRow } from '@/types'

export async function loginUser(loginRequest: LoginRequest) {
  const { email, password } = loginRequest

  const user = await UsersRepository.getUserBy('email', email)

  if (!user) {
    throw new Unauthorized(authMessage.credentialsInvalid)
  }

  if (!user.verified) {
    throw new Forbidden(userMessage.verifyFirst)
  }

  const isPasswordCorrect = await Bun.password.verify(password, user.password)

  if (!isPasswordCorrect) {
    throw new Unauthorized(authMessage.credentialsInvalid)
  }

  if (user.mfaEnabled) {
    const code = randomInt(0, 1000000).toString().padStart(6, '0')
    const mfaToken = await Bun.password.hash(code)
    const mfaExpires = new Date(Date.now() + 10 * 60 * 1000)

    const updated = await UsersRepository.updateUserBy('uuid', user.uuid, {
      mfaToken,
      mfaExpires,
    })

    if (!updated) {
      throw new Internal(authMessage.mfaStateUpdateError)
    }

    try {
      await sendEmail('mfaOtp', {
        toAddress: user.email,
        toName: user.firstName,
        code,
      })
    } catch {
      await UsersRepository.updateUserBy('uuid', user.uuid, {
        mfaToken: null,
        mfaExpires: null,
      })

      throw new Internal(
        authMessage.mfaDeliveryUnavailable,
        'ServiceUnavailable',
        status.SERVICE_UNAVAILABLE,
      )
    }

    return { mfaPending: true as const, email: user.email }
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const accessToken = await signAccessToken(user.uuid, timestamp)
  const refreshToken = await signRefreshToken(user.uuid, timestamp)

  return { accessToken, refreshToken, firstName: user.firstName }
}

export async function verifyMfa(payload: MfaVerifyRequest) {
  const { email, code } = payload

  const user = await UsersRepository.getUserBy('email', email)

  if (!user) {
    throw new Unauthorized(authMessage.credentialsInvalid)
  }

  if (!user.verified) {
    throw new Forbidden(userMessage.verifyFirst)
  }

  if (!user.mfaEnabled) {
    throw new Unauthorized(authMessage.credentialsInvalid)
  }

  if (!user.mfaToken || !user.mfaExpires) {
    throw new Unauthorized(authMessage.mfaCodeExpired)
  }

  const now = Date.now()
  const expires = new Date(user.mfaExpires).getTime()

  if (now > expires) {
    throw new Unauthorized(authMessage.mfaCodeExpired)
  }

  const isCodeCorrect = await Bun.password.verify(code, user.mfaToken)

  if (!isCodeCorrect) {
    throw new Unauthorized(authMessage.mfaCodeError)
  }

  void UsersRepository.updateUserBy('uuid', user.uuid, {
    mfaToken: null,
    mfaExpires: null,
  })

  const timestamp = Math.floor(now / 1000)

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

  const newUser: UserInsertRow = {
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
    throw new Internal(userMessage.createFailed)
  }

  try {
    await sendEmail('verification', {
      toAddress: email,
      toName: firstName,
      tokenLink,
    })
  } catch {
    await UsersRepository.deleteUserBy('uuid', userCreated.uuid)

    throw new Internal(
      userMessage.emailSendFailed,
      'ServiceUnavailable',
      status.SERVICE_UNAVAILABLE,
    )
  }

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
    throw new Internal(authMessage.verifyEmailFailed)
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
    throw new Internal(authMessage.passwordResetRequestFailed)
  }

  try {
    await sendEmail('passwordReset', {
      toAddress: user.email,
      toName: user.firstName,
      tokenLink,
    })
  } catch {
    await UsersRepository.updateUserBy('email', user.email, {
      passwordResetToken: null,
      passwordResetExpires: null,
    })
  }

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

  const expiry = user.passwordResetExpires
  if (expiry && new Date(expiry) < new Date()) {
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
    throw new BadRequest(authMessage.invalidToken)
  }

  const expiry = user.passwordResetExpires
  if (expiry && new Date(expiry) < new Date()) {
    throw new BadRequest(authMessage.invalidToken)
  }

  const userUpdated = await UsersRepository.updateUserBy('email', user.email, {
    password: await Bun.password.hash(password),
    passwordResetToken: null,
    passwordResetExpires: null,
  })

  if (!userUpdated) {
    throw new Internal(authMessage.passwordResetSubmitFailed)
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
    throw new NotFound(userMessage.notFound)
  }

  return toPublicUser(user)
}

export async function updateUserProfile(
  uuid: string,
  updatePayload: UserProfileUpdateRequest,
): Promise<PublicUser> {
  const user = await UsersRepository.getUserBy('uuid', uuid)

  if (!user) {
    throw new NotFound(userMessage.notFound)
  }

  const updateFields: UserUpdateRow = { ...updatePayload }

  if (updateFields.password) {
    updateFields.password = await Bun.password.hash(updateFields.password)
  }

  if (updateFields.mfaEnabled === false) {
    updateFields.mfaToken = null
    updateFields.mfaExpires = null
  }

  const userUpdated = await UsersRepository.updateUserBy('uuid', user.uuid, {
    ...updateFields,
  })

  if (!userUpdated) {
    throw new Internal(userMessage.updateFailed)
  }

  return toPublicUser(userUpdated)
}
