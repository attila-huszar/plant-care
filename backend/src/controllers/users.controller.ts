import {
  type AuthJWTPayload,
  emailSchema,
  loginSchema,
  mfaCodeSchema,
  passwordResetSchema,
  type PublicUser,
  registerSchema,
  tokenSchema,
  userProfileUpdateSchema,
  uuidSchema,
  validate,
} from '@plant-care/shared'
import { Hono } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { cookieOptions, env, REFRESH_TOKEN } from '@/config'
import { UsersService } from '@/services'
import { signAccessToken, signRefreshToken, verifyJWTRefresh } from '@/utils'
import { API_PATHS } from '@/constants'
import { errorHandler } from '@/errors'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const users = new Hono<{ Variables: Variables }>()

users.post(API_PATHS.users.login, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const loginRequest = validate(loginSchema, body)
    const result = await UsersService.loginUser(loginRequest)

    if ('mfaPending' in result) {
      return c.json(result)
    }

    await setSignedCookie(
      c,
      REFRESH_TOKEN,
      result.refreshToken,
      env.cookieSecret!,
      cookieOptions,
    )

    return c.json({
      accessToken: result.accessToken,
      firstName: result.firstName,
    })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.mfaVerify, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const payload = validate(mfaCodeSchema, body)

    const { accessToken, refreshToken, firstName } =
      await UsersService.verifyMfa(payload)

    await setSignedCookie(
      c,
      REFRESH_TOKEN,
      refreshToken,
      env.cookieSecret!,
      cookieOptions,
    )

    return c.json({ accessToken, firstName })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.register, async (c) => {
  try {
    const formData = await c.req.formData()
    const registerRequest = validate(registerSchema, {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
    })
    const { email } = await UsersService.registerUser(registerRequest)

    return c.json({ email })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.verification, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const verificationRequest = validate(tokenSchema, body)
    const { email } = await UsersService.verifyUser(verificationRequest)

    return c.json({ email })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.passwordResetRequest, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(emailSchema, body)
    const { message } = await UsersService.passwordResetRequest(request)

    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.passwordResetToken, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(tokenSchema, body)
    const { token } = await UsersService.passwordResetToken(request)

    return c.json({ token })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.passwordResetSubmit, async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(passwordResetSchema, body)
    const { message } = await UsersService.passwordResetSubmit(request)

    deleteCookie(c, REFRESH_TOKEN, cookieOptions)
    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.get(API_PATHS.users.profile, async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const user: PublicUser = await UsersService.getUserProfile(userUuid)

    return c.json(user)
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.patch(API_PATHS.users.profile, async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const body = await c.req.json<unknown>()
    const updateFields = validate(userProfileUpdateSchema, body)
    const user: PublicUser = await UsersService.updateUserProfile(
      userUuid,
      updateFields,
    )

    return c.json(user)
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.logout, (c) => {
  try {
    deleteCookie(c, REFRESH_TOKEN, cookieOptions)

    return c.json({ success: true })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post(API_PATHS.users.refresh, async (c) => {
  try {
    const refreshTokenCookie = await getSignedCookie(
      c,
      env.cookieSecret!,
      REFRESH_TOKEN,
    )

    if (!refreshTokenCookie) {
      return c.json({ accessToken: null }, 200)
    }

    let jwtPayload: AuthJWTPayload

    try {
      jwtPayload = await verifyJWTRefresh(refreshTokenCookie)
    } catch {
      deleteCookie(c, REFRESH_TOKEN, cookieOptions)
      return c.json({ accessToken: null }, 200)
    }

    const expTimestamp = jwtPayload.exp ?? 0
    const timestamp = Math.floor(Date.now() / 1000)

    if (expTimestamp - 259200 < timestamp) {
      const refreshToken = await signRefreshToken(jwtPayload.uuid, timestamp)
      await setSignedCookie(
        c,
        REFRESH_TOKEN,
        refreshToken,
        env.cookieSecret!,
        cookieOptions,
      )
    }

    const accessToken = await signAccessToken(jwtPayload.uuid, timestamp)

    return c.json({ accessToken })
  } catch (error) {
    return errorHandler(c, error)
  }
})
