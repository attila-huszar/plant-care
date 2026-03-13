import type { Plant } from '@plant-care/shared'
import { Hono } from 'hono'
import httpStatus from 'http-status'
import { PlantsService } from '@/services'
import { errorHandler } from '@/errors'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const plants = new Hono<{ Variables: Variables }>()

plants.get('/', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const data = await PlantsService.getPlantsWithEventsForUuid(jwtPayload.uuid)

    return c.json(data)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.post('/', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const body = await c.req.json<Plant>()
    const plant = await PlantsService.createPlantForUuid(jwtPayload.uuid, body)

    return c.json(plant, httpStatus.CREATED)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.put('/:id', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const body = await c.req.json<Plant>()
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, httpStatus.BAD_REQUEST)
    }

    const plant = await PlantsService.updatePlantForUuid(
      id,
      jwtPayload.uuid,
      body,
    )

    if (!plant) {
      return c.json(
        { error: 'Not found or unauthorized' },
        httpStatus.NOT_FOUND,
      )
    }

    return c.json(plant)
  } catch (error) {
    return errorHandler(c, error)
  }
})

plants.delete('/:id', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, httpStatus.BAD_REQUEST)
    }

    const success = await PlantsService.deletePlantForUuid(id, jwtPayload.uuid)
    if (!success) {
      return c.json(
        { error: 'Not found or unauthorized' },
        httpStatus.NOT_FOUND,
      )
    }

    return c.body(null, httpStatus.NO_CONTENT)
  } catch (error) {
    return errorHandler(c, error)
  }
})
