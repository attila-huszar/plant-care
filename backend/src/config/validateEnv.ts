import { env } from './env'

type EnvKey = keyof typeof env

const requiredKeys: EnvKey[] = [
  'adminEmail',
  'adminPassword',
  'clientBaseUrl',
  'cookieSecret',
  'mailerUser',
  'mailerPass',
  'jwtAccessSecret',
  'jwtRefreshSecret',
  'redisUrl',
]

export function validateEnv(): void {
  const missing = requiredKeys.filter((key) => !env[key])

  if (missing.length > 0) {
    const isDev = process.env.NODE_ENV !== 'prod'

    if (isDev) {
      console.error('\n🚨 ENVIRONMENT CONFIGURATION ERROR 🚨')
      console.error('Missing required environment variables:')
      missing.forEach((key) => console.error(`  - ${key}`))
      console.error(
        '\nPlease add these to your .env file and restart the server.\n',
      )
    } else {
      missing.forEach((key) =>
        console.error(`❌ Missing required env var: ${key}`),
      )
    }

    process.exit(1)
  }
}

validateEnv()
