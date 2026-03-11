import { z } from 'zod'

export const idSchema = z.coerce.number().int()

export const entityWithIdSchema = z.object({
  id: idSchema,
})

export const idsSchema = z.array(idSchema).min(1, 'At least one ID is required')

export const uuidSchema = z.uuid()
