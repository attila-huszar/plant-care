import {
  createEventRequestSchema,
  createPlantRequestSchema,
  idSchema,
  updatePlantRequestSchema,
  uuidSchema,
  validate,
} from '@plant-care/shared'
import { Hono } from 'hono'
import httpStatus from 'http-status'
import { EventsService, PlantsService } from '@/services'
import { errorHandler } from '@/errors'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const plants = new Hono<{ Variables: Variables }>()

plants.post('/:plantId/events', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const body = await c.req.json<unknown>()
    const plantId = validate(idSchema, c.req.param('plantId'))
    const payload = validate(createEventRequestSchema, body)

    const data = await EventsService.createEvent(userUuid, plantId, payload)

    return c.json(data, httpStatus.CREATED)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.delete('/:plantId/events/:eventId', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const plantId = validate(idSchema, c.req.param('plantId'))
    const eventId = validate(idSchema, c.req.param('eventId'))

    await EventsService.deleteEvent(userUuid, plantId, eventId)

    return c.body(null, httpStatus.NO_CONTENT)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.get('/', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)

    const data = await PlantsService.getPlants(userUuid)

    return c.json(data)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.post('/', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const body = await c.req.json<unknown>()
    const payload = validate(createPlantRequestSchema, body)

    const plant = await PlantsService.createPlant(userUuid, payload)

    return c.json(plant, httpStatus.CREATED)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.put('/:id', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const plantId = validate(idSchema, c.req.param('id'))
    const body = await c.req.json<unknown>()
    const payload = validate(updatePlantRequestSchema, body)

    const plant = await PlantsService.updatePlant(userUuid, plantId, payload)

    return c.json(plant)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.delete('/:id', async (c) => {
  try {
    const userUuid = validate(uuidSchema, c.get('jwtPayload')?.uuid)
    const plantId = validate(idSchema, c.req.param('id'))

    await PlantsService.deletePlant(userUuid, plantId)
    return c.body(null, httpStatus.NO_CONTENT)
  } catch (error) {
    return errorHandler(c, error)
  }
})
