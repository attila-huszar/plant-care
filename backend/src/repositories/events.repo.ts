import { eq } from 'drizzle-orm'
import { sqlite } from '@/db'
import { eventsTable } from '@/models'
import type { EventInsert } from '@/types'

export const getEventsByUserId = async (userId: number) => {
  return sqlite.select().from(eventsTable).where(eq(eventsTable.userId, userId))
}

export const getEventsByPlantId = async (plantId: number) => {
  return sqlite
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.plantId, plantId))
}

export const getEventById = async (eventId: number) => {
  const result = await sqlite
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, eventId))
    .limit(1)

  return result[0] ?? null
}

export const insertEvent = async (data: EventInsert) => {
  const result = await sqlite.insert(eventsTable).values(data).returning()

  return result[0] ?? null
}

export const deleteEvent = async (eventId: number) => {
  const result = await sqlite
    .delete(eventsTable)
    .where(eq(eventsTable.id, eventId))
    .returning()

  return result[0] ?? null
}
