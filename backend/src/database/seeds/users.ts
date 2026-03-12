import { env } from '@/config'
import { type UserInsert } from '@/types'

const admin: UserInsert = {
  uuid: crypto.randomUUID(),
  firstName: 'Admin',
  lastName: 'Admin',
  email: env.adminEmail!,
  password: Bun.password.hashSync(env.adminPassword!),
  verified: true,
  verificationToken: null,
  verificationExpires: null,
  passwordResetToken: null,
  passwordResetExpires: null,
}

export async function seedUsers() {
  const { getTableName } = await import('drizzle-orm')
  const { usersTable } = await import('@/models')
  const { sqlite } = await import('@/db')

  await sqlite.insert(usersTable).values(admin)

  return {
    [getTableName(usersTable)]: admin.email,
  }
}
