import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { plantsTable } from '@/models'

export const plantSelectSchema = createSelectSchema(plantsTable)
export const plantInsertSchema = createInsertSchema(plantsTable)
export const plantUpdateSchema = createUpdateSchema(plantsTable)
