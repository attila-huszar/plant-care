import type { Plant, Schedule } from '@plant-care/shared'

export type ScheduleItem = {
  key: string
  plantId: Plant['id']
  plantName: Plant['name']
  scheduleId: Schedule['id']
  actionId: Schedule['actionId']
  notes?: string
  dueDate: Date
  diffDays: number
} & ({ type: 'recurring'; days: number } | { type: 'date' })

export type SchedulePayload = Pick<
  ScheduleItem,
  'plantId' | 'actionId' | 'type' | 'scheduleId' | 'notes'
>
