import type { Event, Plant } from '@plant-care/shared'
import { validate } from '@plant-care/shared'
import { EventsRepository, PlantsRepository } from '@/repositories'
import { plantInsertSchema, plantUpdateSchema } from '@/schemas'
import { requireUserByUuid } from './helpers/requireUserByUuid'

export const getPlantsByUserId = async (userId: number) => {
  return PlantsRepository.getPlantsByUserId(userId)
}

export const getPlantsWithEventsForUuid = async (uuid: string) => {
  const user = await requireUserByUuid(uuid)
  const [plants, events] = await Promise.all([
    PlantsRepository.getPlantsByUserId(user.id),
    EventsRepository.getEventsByUserId(user.id),
  ])

  const eventsByPlantId = new Map<number, Event[]>()
  for (const event of events as unknown as Event[]) {
    const list = eventsByPlantId.get(event.plantId)
    if (list) {
      list.push(event)
    } else {
      eventsByPlantId.set(event.plantId, [event])
    }
  }

  const plantsWithEvents = (plants as unknown as Plant[]).map((plant) => ({
    ...plant,
    events: eventsByPlantId.get(plant.id) ?? [],
  }))

  return { plants: plantsWithEvents }
}

export const createPlantForUuid = async (uuid: string, payload: unknown) => {
  const user = await requireUserByUuid(uuid)
  const data = validate(plantInsertSchema.omit({ userId: true }), payload)
  const plant = await PlantsRepository.insertPlant({ ...data, userId: user.id })
  return { ...plant, events: [] }
}

export const updatePlantForUuid = async (
  id: number,
  uuid: string,
  payload: unknown,
) => {
  const user = await requireUserByUuid(uuid)
  const data = validate(plantUpdateSchema.omit({ userId: true }), payload)
  const plant = await PlantsRepository.updatePlant(id, user.id, data)
  if (!plant) return null

  const events = await EventsRepository.getEventsByPlantIdAndUserId(
    plant.id,
    user.id,
  )

  return { ...plant, events }
}

export const deletePlantForUuid = async (id: number, uuid: string) => {
  const user = await requireUserByUuid(uuid)
  return PlantsRepository.deletePlant(id, user.id)
}
