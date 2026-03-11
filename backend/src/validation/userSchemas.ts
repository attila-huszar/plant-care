import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { usersTable } from '@/models'

export const userSelectSchema = createSelectSchema(usersTable)
export const userInsertSchema = createInsertSchema(usersTable)
export const userUpdateSchema = createUpdateSchema(usersTable)
