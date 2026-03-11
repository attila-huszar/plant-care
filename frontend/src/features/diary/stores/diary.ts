import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

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

export const useDiaryStore = defineStore('diary', () => {
  const plants = useLocalStorage<Plant[]>('plant-care-plants', [])
  const events = useLocalStorage<PlantEvent[]>('plant-care-events', [])
  const customEventTypes = useLocalStorage<CustomEventType[]>(
    'plant-care-custom-event-types',
    [],
  )

  const addPlant = (plant: Omit<Plant, 'id'>) => {
    const newPlant = { ...plant, id: crypto.randomUUID() }
    plants.value.push(newPlant)
    return newPlant
  }

  const removePlant = (id: string) => {
    plants.value = plants.value.filter((p) => p.id !== id)
    events.value = events.value.filter((e) => e.plantId !== id)
  }

  const addEvent = (event: Omit<PlantEvent, 'id'>) => {
    const newEvent = { ...event, id: crypto.randomUUID() }
    events.value.push(newEvent)
    return newEvent
  }

  const removeEvent = (id: string) => {
    events.value = events.value.filter((e) => e.id !== id)
  }

  const addCustomEventType = (name: string) => {
    const newType = { id: crypto.randomUUID(), name }
    customEventTypes.value.push(newType)
    return newType
  }

  const updatePlantOccurrences = (
    plantId: string,
    occurrences: OccurrenceRequirement[],
  ) => {
    plants.value = plants.value.map((p) => {
      if (p.id !== plantId) return p
      return { ...p, occurrences }
    })
  }

  const updatePlantScheduledCare = (
    plantId: string,
    scheduledCare: ScheduledCare[],
  ) => {
    plants.value = plants.value.map((p) => {
      if (p.id !== plantId) return p
      return { ...p, scheduledCare }
    })
  }

  const removeScheduledCareItem = (
    plantId: string,
    scheduledCareId: string,
  ) => {
    plants.value = plants.value.map((p) => {
      if (p.id !== plantId) return p
      return {
        ...p,
        scheduledCare: (p.scheduledCare ?? []).filter(
          (i) => i.id !== scheduledCareId,
        ),
      }
    })
  }

  return {
    plants,
    events,
    customEventTypes,
    addPlant,
    removePlant,
    addEvent,
    removeEvent,
    addCustomEventType,
    updatePlantOccurrences,
    updatePlantScheduledCare,
    removeScheduledCareItem,
  }
})
