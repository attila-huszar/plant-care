import { z } from 'zod'

export const customEventSchema = z.object({
  name: z.string().trim().min(1).max(60),
})
