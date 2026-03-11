import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { env } from './config'

let sqlite: ReturnType<typeof drizzle>

try {
  const sqliteClient = new Database(env.dbSqliteFile)

  sqlite = drizzle({
    client: sqliteClient,
    casing: 'snake_case',
  })
} catch (error) {
  console.error('Error connecting to SQLite:', error)
  process.exit(1)
}

export { sqlite }
