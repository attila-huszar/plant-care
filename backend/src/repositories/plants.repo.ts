import { eq } from 'drizzle-orm'
import { sqlite } from '@/db'
import { plantsTable } from '@/models'
import type { PlantInsert, PlantUpdate } from '@/types'

export const getPlantsByUserId = async (userId: number) => {
  return sqlite.select().from(plantsTable).where(eq(plantsTable.userId, userId))
}

export const getPlantById = async (plantId: number) => {
  const plants = await sqlite
    .select()
    .from(plantsTable)
    .where(eq(plantsTable.id, plantId))
    .limit(1)

  return plants[0] ?? null
}

export const insertPlant = async (data: PlantInsert) => {
  const result = await sqlite.insert(plantsTable).values(data).returning()

  return result[0] ?? null
}

export const updatePlant = async (plantId: number, data: PlantUpdate) => {
  const result = await sqlite
    .update(plantsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(plantsTable.id, plantId))
    .returning()

  return result[0] ?? null
}

export const deletePlant = async (plantId: number) => {
  const result = await sqlite
    .delete(plantsTable)
    .where(eq(plantsTable.id, plantId))
    .returning()

  return result[0] ?? null
}
