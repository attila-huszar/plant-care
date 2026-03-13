import { Hono } from 'hono'
import httpStatus from 'http-status'
import { EventsService } from '@/services'
import { errorHandler } from '@/errors'

type Variables = {
  jwtPayload: {
    uuid: string
  }
}

export const events = new Hono<{ Variables: Variables }>()

events.post('/', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const body = await c.req.json<Event>()
    const data = await EventsService.createEventForUuid(jwtPayload.uuid, body)
    return c.json(data, httpStatus.CREATED)
  } catch (error) {
    return errorHandler(c, error)
  }
})

events.delete('/:id', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload')
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, httpStatus.BAD_REQUEST)
    }

    const success = await EventsService.deleteEventForUuid(id, jwtPayload.uuid)
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
