import { UsersRepository } from '@/repositories'
import { Unauthorized } from '@/errors'

export async function requireUserByUuid(uuid: string) {
  const user = await UsersRepository.getUserBy('uuid', uuid)
  if (!user) throw new Unauthorized()
  return user
}
