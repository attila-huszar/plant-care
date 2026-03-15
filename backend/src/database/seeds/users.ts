import { env } from '@/config'
import { type UserInsert } from '@/types'

const admin: UserInsert = {
  uuid: crypto.randomUUID(),
  firstName: 'Demo User',
  lastName: 'Seeded',
  email: env.adminEmail!,
  password: Bun.password.hashSync(env.adminPassword!),
  verified: true,
  verificationToken: null,
  verificationExpires: null,
  passwordResetToken: null,
  passwordResetExpires: null,
}

export async function seedUsers() {
  const { getTableName, sql } = await import('drizzle-orm')
  const { usersTable } = await import('@/models')
  const { sqlite } = await import('@/db')

  const existingAdmin = await sqlite
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${admin.email.toLowerCase()}`)
    .limit(1)

  if (existingAdmin.length === 0) {
    await sqlite.insert(usersTable).values(admin)
  }

  return {
    [getTableName(usersTable)]: admin.email,
  }
}
