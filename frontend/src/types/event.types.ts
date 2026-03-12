import type { EventType } from '@plant-care/shared'

export type OccurrenceUpcomingItem = {
  key: string
  plantId: string
  plantName: string
  typeId: EventType
  dueDate: Date
  diffDays: number
  kind: 'occurrence'
  cadenceDays: number
}

export type ScheduledUpcomingItem = {
  key: string
  plantId: string
  plantName: string
  typeId: EventType
  dueDate: Date
  diffDays: number
  kind: 'scheduled'
  scheduledCareId: string
}

export type UpcomingItem = OccurrenceUpcomingItem | ScheduledUpcomingItem
