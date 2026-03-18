import type { Plant, Schedule } from '@plant-care/shared'

export type UpcomingItem = {
  key: string
  plantId: Plant['id']
  plantName: Plant['name']
  scheduleId: Schedule['id']
  type: string
  notes?: string
  dueDate: Date
  diffDays: number
} & ({ kind: 'recurring'; days: number } | { kind: 'date' })

export type CareTimelinePayload = {
  plantId: Plant['id']
  type: Schedule['type']
  kind: Schedule['kind']
  scheduleId: Schedule['id']
  notes?: string
}
