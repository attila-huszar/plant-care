import type {
  AuthJWTPayload,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetSubmit,
  PasswordResetToken,
  PublicUser,
  VerificationRequest,
} from '@plant-care/shared'
import { Hono } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { cookieOptions, env, REFRESH_TOKEN } from '@/config'
import { UsersService } from '@/services'
import { signAccessToken, signRefreshToken, verifyJWTRefresh } from '@/utils'
import { errorHandler } from '@/errors'
import type { UserUpdate } from '@/types'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const users = new Hono<{ Variables: Variables }>()

users.post('/login', async (c) => {
  try {
    const loginRequest = await c.req.json<LoginRequest>()
    const { accessToken, refreshToken, firstName } =
      await UsersService.loginUser(loginRequest)

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

users.post('/register', async (c) => {
  try {
    const registerRequest = await c.req.formData()
    const { email } = await UsersService.registerUser(registerRequest)

    return c.json({ email })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/verification', async (c) => {
  try {
    const verificationRequest = await c.req.json<VerificationRequest>()
    const { email } = await UsersService.verifyUser(verificationRequest)

    return c.json({ email })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-request', async (c) => {
  try {
    const request = await c.req.json<PasswordResetRequest>()
    const { message } = await UsersService.passwordResetRequest(request)

    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-token', async (c) => {
  try {
    const request = await c.req.json<PasswordResetToken>()
    const { token } = await UsersService.passwordResetToken(request)

    return c.json({ token })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-submit', async (c) => {
  try {
    const request = await c.req.json<PasswordResetSubmit>()
    const { message } = await UsersService.passwordResetSubmit(request)

    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.get('/profile', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const user: PublicUser = await UsersService.getUserProfile(jwtPayload.uuid)

    return c.json(user)
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.patch('/profile', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const updateFields = await c.req.json<UserUpdate>()
    const user: PublicUser = await UsersService.updateUserProfile(
      jwtPayload.uuid,
      updateFields,
    )

    return c.json(user)
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/logout', (c) => {
  try {
    deleteCookie(c, REFRESH_TOKEN, cookieOptions)

    return c.json({ success: true })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/refresh', async (c) => {
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

users.get('/custom-events', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const customEvents = await UsersService.getCustomEventTypes(jwtPayload.uuid)

    return c.json({ customEvents })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/custom-events', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const body = await c.req.json<CustomEvent>()

    const result = await UsersService.upsertCustomEventType(
      jwtPayload.uuid,
      body,
    )

    return c.json(result.customEvent, result.created ? 201 : 200)
  } catch (error) {
    return errorHandler(c, error)
  }
})
