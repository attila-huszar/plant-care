import type { z } from 'zod'
import type {
  eventInsertSchema,
  eventSelectSchema,
  eventUpdateSchema,
} from '@/schemas'

export type EventRow = z.infer<typeof eventSelectSchema>
export type EventInsertRow = z.infer<typeof eventInsertSchema>
export type EventUpdateRow = z.infer<typeof eventUpdateSchema>
