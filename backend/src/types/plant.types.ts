import type { z } from 'zod'
import type {
  plantInsertSchema,
  plantSelectSchema,
  plantUpdateSchema,
} from '@/schemas'

export type Plant = z.infer<typeof plantSelectSchema>
export type PlantInsert = z.infer<typeof plantInsertSchema>
export type PlantUpdate = z.infer<typeof plantUpdateSchema>
