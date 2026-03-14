import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { eventsTable } from '@/models'

export const eventSelectSchema = createSelectSchema(eventsTable)
export const eventInsertSchema = createInsertSchema(eventsTable)
export const eventUpdateSchema = createUpdateSchema(eventsTable)
