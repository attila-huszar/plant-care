import { computed, reactive, ref } from 'vue'
import { API_PATHS } from '@/constants'
import { defineStore } from 'pinia'
import {
  createEventResponseSchema,
  listPlantsResponseSchema,
  plantDtoSchema,
  validate,
} from '@plant-care/shared'
import type {
  CreateEventRequest,
  CreatePlantRequest,
  PlantDto,
  UpdatePlantRequest,
} from '@plant-care/shared'
import { useAuthStore } from '@/features/auth/stores'
import { useApiFetch, useApiFetchAuthRetry, withAuth } from '@/composables'

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<PlantDto[]>([])
  const events = computed(() => {
    return plants.value.flatMap((p) => p.history)
  })
  const plantsReq = reactive({ loading: false, error: null as string | null })
  const eventsReq = reactive({ loading: false, error: null as string | null })

  const authStore = useAuthStore()
  const { fetchWithAuthRetry } = useApiFetchAuthRetry()

  const getPlants = async () => {
    plantsReq.loading = true
    plantsReq.error = null
    try {
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(API_PATHS.plants.root, withAuth(authStore.accessToken))
          .get()
          .json<unknown>(),
      )
      if (!apiResult.ok) {
        if (apiResult.status === 401 || apiResult.status === 403) {
          plants.value = []
        }
        plantsReq.error = 'Failed to load plants'
        return
      }

      const data = validate(listPlantsResponseSchema, apiResult.data)
      plants.value = data.plants
    } catch (e) {
      console.error('Failed to load plants', e)
      plantsReq.error = 'Failed to load plants'
    } finally {
      plantsReq.loading = false
    }
  }

  const addPlant = async (plant: CreatePlantRequest) => {
    plantsReq.loading = true
    plantsReq.error = null
    try {
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(API_PATHS.plants.root, withAuth(authStore.accessToken))
          .post(plant, 'json')
          .json<unknown>(),
      )
      if (!apiResult.ok) {
        plantsReq.error = 'Failed to add plant'
        return null
      }

      const data = validate(plantDtoSchema, apiResult.data)
      upsertPlant(data)
      return data
    } catch (e) {
      console.error('Failed to add plant', e)
      plantsReq.error = 'Failed to add plant'
      return null
    } finally {
      plantsReq.loading = false
    }
  }

  const updatePlant = async (plantId: number, patch: UpdatePlantRequest) => {
    if (Object.keys(patch).length === 0) return null

    plantsReq.loading = true
    plantsReq.error = null
    try {
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(
          API_PATHS.plants.byId(plantId),
          withAuth(authStore.accessToken),
        )
          .put(patch, 'json')
          .json<unknown>(),
      )
      if (!apiResult.ok) {
        plantsReq.error = 'Failed to update plant'
        return null
      }

      const data = validate(plantDtoSchema, apiResult.data)
      upsertPlant(data)
      return data
    } catch (e) {
      console.error('Failed to update plant', e)
      plantsReq.error = 'Failed to update plant'
      return null
    } finally {
      plantsReq.loading = false
    }
  }

  const removePlant = async (id: number) => {
    plantsReq.loading = true
    plantsReq.error = null
    try {
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(API_PATHS.plants.byId(id), withAuth(authStore.accessToken))
          .delete()
          .text(),
      )
      if (!apiResult.ok) {
        plantsReq.error = 'Failed to remove plant'
        return null
      }

      plants.value = plants.value.filter((p) => p.id !== id)
      return true
    } catch (e) {
      console.error('Failed to remove plant', e)
      plantsReq.error = 'Failed to remove plant'
      return null
    } finally {
      plantsReq.loading = false
    }
  }

  const addEvent = async (
    event: CreateEventRequest & { plantId: PlantDto['id'] },
  ) => {
    eventsReq.loading = true
    eventsReq.error = null
    try {
      const { plantId, ...body } = event
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(
          API_PATHS.plants.events(plantId),
          withAuth(authStore.accessToken),
        )
          .post(body, 'json')
          .json<unknown>(),
      )
      if (!apiResult.ok) {
        eventsReq.error = 'Failed to add event'
        return null
      }

      const data = validate(createEventResponseSchema, apiResult.data)
      upsertPlant(data.plant)
      return data.event
    } catch (e) {
      console.error('Failed to add event', e)
      eventsReq.error = 'Failed to add event'
      return null
    } finally {
      eventsReq.loading = false
    }
  }

  const removeEvent = async (plantId: number, eventId: number) => {
    eventsReq.loading = true
    eventsReq.error = null
    try {
      const apiResult = await fetchWithAuthRetry<unknown>(() =>
        useApiFetch(
          API_PATHS.plants.eventById(plantId, eventId),
          withAuth(authStore.accessToken),
        )
          .delete()
          .text(),
      )
      if (!apiResult.ok) {
        eventsReq.error = 'Failed to remove event'
        return null
      }

      const idx = plants.value.findIndex((p) => p.id === plantId)
      if (idx !== -1) {
        const plant = plants.value[idx]
        const next = [...plants.value]
        next[idx] = {
          ...plant,
          history: plant.history.filter((e) => e.id !== eventId),
        }
        plants.value = next
      }
      return true
    } catch (e) {
      console.error('Failed to remove event', e)
      eventsReq.error = 'Failed to remove event'
      return null
    } finally {
      eventsReq.loading = false
    }
  }

  const upsertPlant = (plant: PlantDto) => {
    const idx = plants.value.findIndex((p) => p.id === plant.id)
    const next = [...plants.value]

    if (idx === -1) {
      next.push(plant)
    } else {
      next[idx] = plant
    }
    plants.value = next
  }

  const removeSchedule = async (plantId: number, scheduleId: string) => {
    const p = plants.value.find((plant) => plant.id === plantId)
    if (!p) return

    const nextSchedules = p.schedules.filter((t) => t.id !== scheduleId)
    if (nextSchedules.length === p.schedules.length) return

    return updatePlant(plantId, { schedules: nextSchedules })
  }

  const clear = () => {
    plants.value = []
    plantsReq.loading = false
    plantsReq.error = null
    eventsReq.loading = false
    eventsReq.error = null
  }

  return {
    plants,
    events,
    plantsReq,
    eventsReq,
    getPlants,
    addPlant,
    updatePlant,
    removePlant,
    addEvent,
    removeEvent,
    removeSchedule,
    clear,
  }
})
