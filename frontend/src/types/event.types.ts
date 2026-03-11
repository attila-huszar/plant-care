export type EventType = 'water' | 'fertilize' | 'repot' | (string & {})

export interface CustomEventType {
  id: string
  name: string
}

export interface PlantEvent {
  id: string
  plantId: string
  typeId: EventType
  date: string
  notes?: string
}

export interface OccurrenceRequirement {
  typeId: EventType
  days: number
}

export interface ScheduledCare {
  id: string
  typeId: EventType
  date: string
}

export interface Plant {
  id: string
  name: string
  species: string
  imageUrl?: string
  dateAdded: string
  occurrences: OccurrenceRequirement[]
  scheduledCare?: ScheduledCare[]
}
