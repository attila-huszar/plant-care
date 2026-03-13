import { validate } from '@plant-care/shared'
import { EventsRepository, PlantsRepository } from '@/repositories'
import { eventInsertSchema } from '@/schemas'
import { BadRequest } from '@/errors'
import { requireUserByUuid } from './helpers/requireUserByUuid'

export const getEventsByUserId = async (userId: number) => {
  return EventsRepository.getEventsByUserId(userId)
}

export const createEventForUuid = async (uuid: string, payload: unknown) => {
  const user = await requireUserByUuid(uuid)
  const data = validate(eventInsertSchema.omit({ userId: true }), payload)

  const plant = await PlantsRepository.getPlantByIdAndUserId(
    data.plantId,
    user.id,
  )
  if (!plant) {
    throw new BadRequest('Plant not found or does not belong to user')
  }

  const event = await EventsRepository.insertEvent({ ...data, userId: user.id })
  const events = await EventsRepository.getEventsByPlantIdAndUserId(
    data.plantId,
    user.id,
  )

  return { event, plant: { ...plant, events } }
}

export const deleteEventForUuid = async (id: number, uuid: string) => {
  const user = await requireUserByUuid(uuid)
  return EventsRepository.deleteEvent(id, user.id)
}
