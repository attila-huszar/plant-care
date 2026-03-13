import { and, eq } from 'drizzle-orm'
import { sqlite } from '@/db'
import { eventsTable } from '@/models'
import type { EventInsert } from '@/types'

export const getEventsByUserId = async (userId: number) => {
  return sqlite.select().from(eventsTable).where(eq(eventsTable.userId, userId))
}

export const getEventsByPlantIdAndUserId = async (
  plantId: number,
  userId: number,
) => {
  return sqlite
    .select()
    .from(eventsTable)
    .where(
      and(eq(eventsTable.plantId, plantId), eq(eventsTable.userId, userId)),
    )
}

export const insertEvent = async (data: EventInsert) => {
  const result = await sqlite.insert(eventsTable).values(data).returning()
  return result[0]
}

export const deleteEvent = async (id: number, userId: number) => {
  const events = await sqlite
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id))
    .limit(1)

  const event = events[0]
  if (event?.userId !== userId) return false

  await sqlite.delete(eventsTable).where(eq(eventsTable.id, id))
  return true
}
