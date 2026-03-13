import type { CreateEventRequest } from '@plant-care/shared'
import {
  EventsRepository,
  PlantsRepository,
  UsersRepository,
} from '@/repositories'
import { toPublicEvent, toPublicPlant } from '@/utils'
import { Internal, NotFound, Unauthorized } from '@/errors'

export const createEvent = async (
  userUuid: string,
  plantId: number,
  payload: CreateEventRequest,
) => {
  const user = await UsersRepository.getUserBy('uuid', userUuid)
  if (!user) throw new Unauthorized()

  const plant = await PlantsRepository.getPlantById(plantId)
  if (plant?.userId !== user.id) throw new NotFound()

  const event = await EventsRepository.insertEvent({
    ...payload,
    plantId,
    userId: user.id,
  })
  if (!event) throw new Internal('Failed to create event')

  const events = await EventsRepository.getEventsByPlantId(plantId)

  return {
    event: toPublicEvent(event),
    plant: {
      ...toPublicPlant(plant),
      history: events.map(toPublicEvent),
    },
  }
}

export const deleteEvent = async (
  userUuid: string,
  plantId: number,
  eventId: number,
) => {
  const user = await UsersRepository.getUserBy('uuid', userUuid)
  if (!user) throw new Unauthorized()

  const [plant, event] = await Promise.all([
    PlantsRepository.getPlantById(plantId),
    EventsRepository.getEventById(eventId),
  ])

  if (plant?.userId !== user.id) throw new NotFound()
  if (event?.userId !== user.id || event?.plantId !== plantId)
    throw new NotFound()

  return EventsRepository.deleteEvent(eventId)
}
