import './config/validateEnv'
import { Hono, type MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { timeout } from 'hono/timeout'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { env } from './config/env'
import { events, plants, users } from './controllers'
import { initMailer } from './libs'
import { authMiddleware, payloadLimiter } from './middleware'
import { ngrokForward } from './utils'

const app = new Hono()
const api = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  message: { error: 'Too many requests' },
  statusCode: 429,
  standardHeaders: 'draft-6',
  keyGenerator: (c) =>
    c.req.header('X-Forwarded-For') ?? c.req.header('X-Real-Ip') ?? 'unknown',
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

api.use('/users/profile', authMiddleware)
api.use('/users/logout', authMiddleware)
api.use('/users/custom-events', authMiddleware)
api.use('/plants', authMiddleware)
api.use('/events', authMiddleware)

api.route('/users', users)
api.route('/plants', plants)
api.route('/events', events)
app.route('/api', api)

void initMailer()
if (env.ngrokAuthToken) void ngrokForward()

export default app
