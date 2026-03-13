import {
  type AuthJWTPayload,
  createCustomEventRequestSchema,
  emailSchema,
  loginSchema,
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
import { errorHandler } from '@/errors'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const users = new Hono<{ Variables: Variables }>()

users.post('/login', async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const loginRequest = validate(loginSchema, body)
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

users.post('/verification', async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const verificationRequest = validate(tokenSchema, body)
    const { email } = await UsersService.verifyUser(verificationRequest)

    return c.json({ email })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-request', async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(emailSchema, body)
    const { message } = await UsersService.passwordResetRequest(request)

    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-token', async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(tokenSchema, body)
    const { token } = await UsersService.passwordResetToken(request)

    return c.json({ token })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/password-reset-submit', async (c) => {
  try {
    const body = await c.req.json<unknown>()
    const request = validate(passwordResetSchema, body)
    const { message } = await UsersService.passwordResetSubmit(request)

    return c.json({ message })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.get('/profile', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const user: PublicUser = await UsersService.getUserProfile(userUuid)

    return c.json(user)
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.patch('/profile', async (c) => {
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
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const customEvents = await UsersService.getCustomEventTypes(userUuid)

    return c.json({ customEvents })
  } catch (error) {
    return errorHandler(c, error)
  }
})

users.post('/custom-events', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const body = await c.req.json<unknown>()
    const payload = validate(createCustomEventRequestSchema, body)

    const result = await UsersService.upsertCustomEventType(userUuid, payload)

    return c.json(result.customEvent, result.created ? 201 : 200)
  } catch (error) {
    return errorHandler(c, error)
  }
})
