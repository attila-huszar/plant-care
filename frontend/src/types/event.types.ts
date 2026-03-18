import type { EventType, PlantDto, Schedule } from '@plant-care/shared'

export type UpcomingItem = {
  key: string
  plantId: PlantDto['id']
  plantName: PlantDto['name']
  scheduleId: Schedule['id']
  type: EventType
  notes?: string
  dueDate: Date
  diffDays: number
} & ({ kind: 'recurring'; days: number } | { kind: 'date' })

export type CareTimelinePayload = {
  plantId: PlantDto['id']
  type: Schedule['type']
  kind: Schedule['kind']
  scheduleId: Schedule['id']
  notes?: string
}
