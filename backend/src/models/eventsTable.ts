import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './column.helpers'
import { plantsTable } from './plantsTable'
import { usersTable } from './usersTable'

export const eventsTable = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  plantId: integer('plant_id')
    .notNull()
    .references(() => plantsTable.id, { onDelete: 'cascade' }),
  typeId: text('type_id').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  ...timestamps,
})
