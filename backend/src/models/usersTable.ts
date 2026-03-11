import { sql } from 'drizzle-orm'
import {
  int,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { timestamps } from './column.helpers'

export const usersTable = sqliteTable(
  'users',
  {
    id: int().primaryKey({ autoIncrement: true }),
    uuid: text().unique().notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    password: text().notNull(),
    verified: int({ mode: 'boolean' }).notNull().$type<boolean>(),
    verificationToken: text('verification_token'),
    verificationExpires: integer('verification_expires', {
      mode: 'timestamp',
    }).$type<Date>(),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: integer('password_reset_expires', {
      mode: 'timestamp',
    }).$type<Date>(),
    ...timestamps,
  },
  (table) => [uniqueIndex('email_unique_ci').on(sql`lower(${table.email})`)],
)
