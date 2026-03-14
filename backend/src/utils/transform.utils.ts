import type { EventDto, PlantDto, PublicUser } from '@plant-care/shared'
import type { Event, Plant, User } from '@/types'

export const toPublicUser = (user: User): PublicUser => {
  const {
    id,
    password,
    verified,
    verificationToken,
    verificationExpires,
    passwordResetToken,
    passwordResetExpires,
    createdAt,
    updatedAt,
    ...publicUser
  } = user

  return publicUser
}

export const toPublicPlant = (plant: Plant): Omit<PlantDto, 'history'> => {
  const { userId, createdAt, updatedAt, ...publicPlant } = plant
  return publicPlant
}

export const toPublicEvent = (event: Event): EventDto => {
  const { userId, createdAt, updatedAt, ...publicEvent } = event
  return publicEvent
}

export const stripTimestamps = <T extends { createdAt: Date; updatedAt: Date }>(
  entity: T,
): WithoutTS<T> => {
  const { createdAt, updatedAt, ...rest } = entity
  return rest
}
