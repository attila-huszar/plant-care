import type { z } from 'zod'
import type {
  userInsertSchema,
  userSelectSchema,
  userUpdateSchema,
} from '@/schemas'

export type UserRow = z.infer<typeof userSelectSchema>
export type UserInsertRow = z.infer<typeof userInsertSchema>
export type UserUpdateRow = z.infer<typeof userUpdateSchema>

export type GetUserBy = Extract<
  keyof UserRow,
  | 'id'
  | 'uuid'
  | 'email'
  | 'verificationToken'
  | 'passwordResetToken'
  | 'mfaToken'
>
