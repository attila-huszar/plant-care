import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import type {
  CustomEvent,
  Event,
  Occurrence,
  Plant,
  Scheduled,
} from '@plant-care/shared'
import { useAuthStore } from '@/features/auth/stores/auth'
import { useApiFetch, withAuth } from '@/composables'

export const useDiaryStore = defineStore('diary', () => {
  const plants = ref<Plant[]>([])
  const events = ref<Event[]>([])
  const customEvents = ref<CustomEvent[]>([])
  const isLoading = ref(false)

  const authStore = useAuthStore()
  const { accessToken } = storeToRefs(authStore)

  const syncEventsFromPlants = () => {
    const joined = plants.value as (Plant & { events?: Event[] })[]
    events.value = joined.flatMap((p) => p.events ?? [])
  }

  const createCustomEventType = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const existing = customEvents.value.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) return existing

    const res = await useApiFetch('/users/custom-events', withAuth(accessToken))
      .post({ name: trimmed }, 'json')
      .json<CustomEvent>()

    if (!res.response.value?.ok || !res.data.value) return null

    const created = res.data.value
    if (!customEvents.value.some((t) => t.id === created.id)) {
      customEvents.value.push(created)
    }
    return created
  }

  const loadDiary = async () => {
    isLoading.value = true
    try {
      const [plantsRes, customTypesRes] = await Promise.all([
        useApiFetch('/plants', withAuth(accessToken))
          .get()
          .json<{ plants?: Plant[] }>(),
        useApiFetch('/users/custom-events', withAuth(accessToken))
          .get()
          .json<{ customEventTypes?: CustomEvent[] }>(),
      ])

      if (plantsRes.response.value?.ok) {
        plants.value = plantsRes.data.value?.plants ?? []
        syncEventsFromPlants()
      }

      if (customTypesRes.response.value?.ok) {
        customEvents.value = customTypesRes.data.value?.customEventTypes ?? []
      }
    } catch (e) {
      console.error('Failed to load diary', e)
    } finally {
      isLoading.value = false
    }
  }

  const addPlant = async (
    plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const res = await useApiFetch('/plants', withAuth(accessToken))
      .post(plant, 'json')
      .json<Plant & { events?: Event[] }>()

    if (res.response.value?.ok && res.data.value) {
      plants.value.push(res.data.value)
      syncEventsFromPlants()
      return res.data.value
    }
  }

  const removePlant = async (id: number) => {
    const res = await useApiFetch(`/plants/${id}`, withAuth(accessToken))
      .delete()
      .text()

    if (res.response.value?.ok) {
      plants.value = plants.value.filter((p) => p.id !== id)
      syncEventsFromPlants()
    }
  }

  const addEvent = async (event: Omit<Event, 'id'>) => {
    const res = await useApiFetch('/events', withAuth(accessToken))
      .post(event, 'json')
      .json<{ event: Event; plant: Plant & { events?: Event[] } }>()

    if (res.response.value?.ok && res.data.value) {
      const updatedPlant = res.data.value.plant
      plants.value = plants.value.map((p) =>
        p.id === updatedPlant.id ? updatedPlant : p,
      )
      syncEventsFromPlants()
      return res.data.value.event
    }
  }

  const removeEvent = async (id: number) => {
    const res = await useApiFetch(`/events/${id}`, withAuth(accessToken))
      .delete()
      .text()

    if (res.response.value?.ok) {
      plants.value = (plants.value as (Plant & { events?: Event[] })[]).map(
        (p) => ({
          ...p,
          events: (p.events ?? []).filter((e) => e.id !== id),
        }),
      )
      syncEventsFromPlants()
    }
  }

  const updatePlantOccurrences = async (
    plantId: number,
    occurrences: Occurrence[],
  ) => {
    const res = await useApiFetch(`/plants/${plantId}`, withAuth(accessToken))
      .put({ occurrences }, 'json')
      .json<Plant & { events?: Event[] }>()

    if (res.response.value?.ok && res.data.value) {
      const updatedPlant = res.data.value
      plants.value = plants.value.map((p) => {
        if (p.id !== plantId) return p
        return updatedPlant
      })
      syncEventsFromPlants()
    }
  }

  const updatePlantScheduledCare = async (
    plantId: number,
    scheduledCare: Scheduled[],
  ) => {
    const res = await useApiFetch(`/plants/${plantId}`, withAuth(accessToken))
      .put({ scheduled: scheduledCare }, 'json')
      .json<Plant & { events?: Event[] }>()

    if (res.response.value?.ok && res.data.value) {
      const updatedPlant = res.data.value
      plants.value = plants.value.map((p) => {
        if (p.id !== plantId) return p
        return updatedPlant
      })
      syncEventsFromPlants()
    }
  }

  const removeScheduledCareItem = async (
    plantId: number,
    scheduledId: string,
  ) => {
    const p = plants.value.find((plant) => plant.id === plantId)
    if (!p) return

    const newScheduled = (p.scheduled ?? []).filter((i) => i.id !== scheduledId)

    return updatePlantScheduledCare(plantId, newScheduled)
  }

  return {
    plants,
    events,
    customEvents,
    isLoading,
    loadDiary,
    createCustomEventType,
    addPlant,
    removePlant,
    addEvent,
    removeEvent,
    updatePlantOccurrences,
    updatePlantScheduledCare,
    removeScheduledCareItem,
  }
})
