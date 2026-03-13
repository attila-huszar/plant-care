import type { EventType } from '@plant-care/shared'

export type UpcomingItem = {
  key: string
  plantId: number
  plantName: string
  typeId: EventType
  dueDate: Date
  diffDays: number
} & (
  | { kind: 'occurrence'; cadenceDays: number }
  | { kind: 'scheduled'; scheduledCareId: string }
)
