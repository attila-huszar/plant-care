import { env } from './env'

export const REFRESH_TOKEN = 'refresh_token'

export const cookieOptions: CookieOptions = {
  maxAge: Number(env.cookieMaxAge) || 1209600,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/users/refresh',
}

type CookieOptions = {
  maxAge: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  path: string
}
