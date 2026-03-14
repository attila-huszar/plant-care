import type { z } from 'zod'
import type {
  userInsertSchema,
  userSelectSchema,
  userUpdateSchema,
} from '@/schemas'

export type User = z.infer<typeof userSelectSchema>
export type UserInsert = z.infer<typeof userInsertSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>

export type GetUserBy = Extract<
  keyof User,
  'id' | 'uuid' | 'email' | 'verificationToken' | 'passwordResetToken'
>
