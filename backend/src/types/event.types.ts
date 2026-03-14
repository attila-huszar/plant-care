import type { z } from 'zod'
import type {
  eventInsertSchema,
  eventSelectSchema,
  eventUpdateSchema,
} from '@/schemas'

export type Event = z.infer<typeof eventSelectSchema>
export type EventInsert = z.infer<typeof eventInsertSchema>
export type EventUpdate = z.infer<typeof eventUpdateSchema>
