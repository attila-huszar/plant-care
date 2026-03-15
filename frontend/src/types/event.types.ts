import type { CareRule, EventType, PlantDto } from '@plant-care/shared'

export type UpcomingItem = {
  key: string
  plantId: PlantDto['id']
  plantName: PlantDto['name']
  careRuleId: CareRule['id']
  type: EventType
  notes?: string
  dueDate: Date
  diffDays: number
} & ({ kind: 'recurring'; days: number } | { kind: 'date' })

export type CareTimelinePayload = {
  plantId: PlantDto['id']
  type: CareRule['type']
  kind: CareRule['kind']
  careRuleId: CareRule['id']
  notes?: string
}
