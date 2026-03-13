import type { CreatePlantRequest, UpdatePlantRequest } from '@plant-care/shared'
import {
  EventsRepository,
  PlantsRepository,
  UsersRepository,
} from '@/repositories'
import { toPublicEvent, toPublicPlant } from '@/utils'
import { Internal, NotFound, Unauthorized } from '@/errors'
import type { Event, PlantInsert } from '@/types'

export const getPlants = async (uuid: string) => {
  const user = await UsersRepository.getUserBy('uuid', uuid)
  if (!user) throw new Unauthorized()

  const [plants, events] = await Promise.all([
    PlantsRepository.getPlantsByUserId(user.id),
    EventsRepository.getEventsByUserId(user.id),
  ])

  const eventsByPlantId = new Map<number, Event[]>()

  for (const event of events) {
    const list = eventsByPlantId.get(event.plantId)
    if (list) {
      list.push(event)
    } else {
      eventsByPlantId.set(event.plantId, [event])
    }
  }

  const plantsWithHistory = plants.map((plant) => ({
    ...toPublicPlant(plant),
    history: (eventsByPlantId.get(plant.id) ?? []).map(toPublicEvent),
  }))

  return { plants: plantsWithHistory }
}

export const createPlant = async (
  userUuid: string,
  payload: CreatePlantRequest,
) => {
  const user = await UsersRepository.getUserBy('uuid', userUuid)
  if (!user) throw new Unauthorized()

  const insertPayload: PlantInsert = {
    ...payload,
    userId: user.id,
  }

  const plant = await PlantsRepository.insertPlant(insertPayload)
  if (!plant) throw new Internal('Failed to create plant')

  return { ...toPublicPlant(plant), history: [] }
}

export const updatePlant = async (
  userUuid: string,
  plantId: number,
  payload: UpdatePlantRequest,
) => {
  const user = await UsersRepository.getUserBy('uuid', userUuid)
  if (!user) throw new Unauthorized()

  const existing = await PlantsRepository.getPlantById(plantId)
  if (existing?.userId !== user.id) throw new NotFound()

  const [plant, events] = await Promise.all([
    PlantsRepository.updatePlant(plantId, payload),
    EventsRepository.getEventsByPlantId(plantId),
  ])
  if (!plant) throw new NotFound()

  return {
    ...toPublicPlant(plant),
    history: events.map(toPublicEvent),
  }
}

export const deletePlant = async (userUuid: string, plantId: number) => {
  const user = await UsersRepository.getUserBy('uuid', userUuid)
  if (!user) throw new Unauthorized()

  const existing = await PlantsRepository.getPlantById(plantId)
  if (existing?.userId !== user.id) throw new NotFound()

  return PlantsRepository.deletePlant(plantId)
}
