import { eq } from 'drizzle-orm'
import { sqlite } from '@/db'
import { plantsTable } from '@/models'
import type { PlantInsert, PlantUpdate } from '@/types'

export const getPlantsByUserId = async (userId: number) => {
  return sqlite.select().from(plantsTable).where(eq(plantsTable.userId, userId))
}

export const getPlantByIdAndUserId = async (id: number, userId: number) => {
  const plants = await sqlite
    .select()
    .from(plantsTable)
    .where(eq(plantsTable.id, id))
    .limit(1)

  const plant = plants[0]
  if (plant?.userId === userId) {
    return plant
  }
  return null
}

export const insertPlant = async (data: PlantInsert) => {
  const result = await sqlite.insert(plantsTable).values(data).returning()
  return result[0]
}

export const updatePlant = async (
  id: number,
  userId: number,
  data: PlantUpdate,
) => {
  const result = await sqlite
    .update(plantsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(plantsTable.id, id))
    .returning()

  const updated = result[0]
  if (updated?.userId === userId) {
    return updated
  }
  return null
}

export const deletePlant = async (id: number, userId: number) => {
  const plant = await getPlantByIdAndUserId(id, userId)
  if (!plant) return false

  await sqlite.delete(plantsTable).where(eq(plantsTable.id, id))
  return true
}
