import type { z } from 'zod'
import type {
  plantInsertSchema,
  plantSelectSchema,
  plantUpdateSchema,
} from '@/schemas'

export type PlantRow = z.infer<typeof plantSelectSchema>
export type PlantInsertRow = z.infer<typeof plantInsertSchema>
export type PlantUpdateRow = z.infer<typeof plantUpdateSchema>
