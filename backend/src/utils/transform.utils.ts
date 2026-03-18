import type { Event, Plant, PublicUser } from '@plant-care/shared'
import type { EventRow, PlantRow, UserRow } from '@/types'

export const toPublicUser = (user: UserRow): PublicUser => {
  const {
    id,
    password,
    verified,
    verificationToken,
    verificationExpires,
    passwordResetToken,
    passwordResetExpires,
    mfaToken,
    mfaExpires,
    customEvents,
    createdAt,
    updatedAt,
    ...publicUser
  } = user

  return { ...publicUser, customEvents: customEvents ?? [] }
}

export const toPublicPlant = (plant: PlantRow): Omit<Plant, 'history'> => {
  const { userId, createdAt, updatedAt, ...publicPlant } = plant
  return publicPlant
}

export const toPublicEvent = (event: EventRow): Event => {
  const { userId, createdAt, updatedAt, ...publicEvent } = event
  return publicEvent
}

export const stripTimestamps = <T extends { createdAt: Date; updatedAt: Date }>(
  entity: T,
): WithoutTS<T> => {
  const { createdAt, updatedAt, ...rest } = entity
  return rest
}
