export type Plant = {
  id: number
  name: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  occurrences: Occurrence[]
  scheduled?: Scheduled[]
}

export type EventType = 'water' | 'fertilize' | 'repot' | (string & {})

export type Event = {
  id: number
  plantId: number
  typeId: EventType
  date: string
  notes?: string
}

export type CustomEvent = {
  id: string
  name: string
}

export type Occurrence = {
  typeId: EventType
  days: number
}

export type Scheduled = {
  id: string
  typeId: EventType
  date: string
}
