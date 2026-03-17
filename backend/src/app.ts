import './config/validateEnv'
import { Hono, type MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { timeout } from 'hono/timeout'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { env } from './config/env'
import { API_PATHS } from './constants'
import { plants, users } from './controllers'
import { initMailer } from './libs'
import { authMiddleware, payloadLimiter } from './middleware'
import { ngrokForward, shortHash } from './utils'

const app = new Hono()
const api = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  message: { error: 'Too many requests' },
  statusCode: 429,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const forwarded =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For') ??
      c.req.header('X-Real-Ip')

    const forwardedIp = forwarded ? forwarded.split(',')[0]!.trim() : 'unknown'

    const userAgent = c.req.header('User-Agent') ?? ''
    const acceptLanguage = c.req.header('Accept-Language') ?? ''
    const fingerprint = shortHash(`${userAgent}|${acceptLanguage}`)

    return `${forwardedIp}:${fingerprint}`
  },
})

const corsMiddleware = cors({
  origin: env.clientBaseUrl!,
  allowHeaders: ['authorization', 'content-type', 'ngrok-skip-browser-warning'],
  allowMethods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
})

app.use('*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error(`${c.req.method} ${c.req.url}`, { error })
    throw error
  }
})

app.use(limiter)
app.use(trimTrailingSlash())
app.use('*', corsMiddleware)
app.use('*', payloadLimiter)
app.use('*', timeout(10000))

if (Bun.env.NODE_ENV === 'production') {
  const csrfMiddleware: MiddlewareHandler = csrf({
    origin: [env.clientBaseUrl!],
  })

  app.use('*', csrfMiddleware)
}

app.get('/health', (c) => c.text('OK', 200))

api.use(API_PATHS.users.logout, authMiddleware)
api.use(API_PATHS.users.profile, authMiddleware)
api.use(API_PATHS.plants.wildcard, authMiddleware)

api.route('/', users)
api.route('/', plants)
app.route('/api', api)

void initMailer()
if (env.ngrokAuthToken) void ngrokForward()

export default app
