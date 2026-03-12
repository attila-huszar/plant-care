import { defineConfig } from 'drizzle-kit'
import { MIGRATIONS_DIR, MODELS_DIR, SQLITE_URL } from './src/constants/paths'

export default defineConfig({
  dialect: 'sqlite',
  dbCredentials: {
    url: SQLITE_URL,
  },
  out: MIGRATIONS_DIR,
  schema: MODELS_DIR,
})
