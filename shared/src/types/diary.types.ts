export type EventTypeId = 'water' | 'fertilize' | 'repot' | (string & {})

export type EventType = EventTypeId

export type PlantEvent = {
  id: string
  plantId: string
  typeId: EventType
  date: string
  notes?: string
}

export type CustomEventType = {
  id: string
  name: string
}

export type OccurrenceRequirement = {
  typeId: EventType
  days: number
}

export type ScheduledCare = {
  id: string
  typeId: EventType
  date: string
}

export type Plant = {
  id: string
  name: string
  species: string
  imageUrl?: string
  dateAdded: string
  occurrences: OccurrenceRequirement[]
  scheduledCare?: ScheduledCare[]
}
