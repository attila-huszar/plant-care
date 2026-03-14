import type { CareRule } from '@plant-care/shared'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './column.helpers'
import { usersTable } from './usersTable'

export const plantsTable = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  careRules: text('care_rules', { mode: 'json' })
    .notNull()
    .default('[]')
    .$type<CareRule[]>(),
  imageUrl: text('image_url'),
  ...timestamps,
})
