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
import { useApiFetch, withAuth } from '@/composables'
import { toApiResult } from '@/utils'

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<PlantDto[]>([])
  const events = computed(() => {
    return plants.value.flatMap((p) => p.history)
  })
  const plantsReq = reactive({ loading: false, error: null as string | null })
  const eventsReq = reactive({ loading: false, error: null as string | null })

  const authStore = useAuthStore()

  const apiFetch = (path: string) => {
    return useApiFetch(path, withAuth(authStore.accessToken))
  }

  const setPlants = (next: PlantDto[]) => {
    plants.value = next
  }

  const getPlants = async () => {
    plantsReq.loading = true
    plantsReq.error = null
    try {
      const res = await apiFetch(API_PATHS.plants.root).get().json<unknown>()

      const apiResult = toApiResult<unknown>(res)
      if (!apiResult.ok) {
        plantsReq.error = 'Failed to load plants'
        return
      }

      const data = validate(listPlantsResponseSchema, apiResult.data)
      setPlants(data.plants)
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
      const res = await apiFetch(API_PATHS.plants.root)
        .post(plant, 'json')
        .json<unknown>()

      const apiResult = toApiResult<unknown>(res)
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

  const removePlant = async (id: number) => {
    plantsReq.loading = true
    plantsReq.error = null
    try {
      const res = await apiFetch(API_PATHS.plants.byId(id)).delete().text()

      const apiResult = toApiResult(res)
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

  const updatePlant = async (plantId: number, patch: UpdatePlantRequest) => {
    if (Object.keys(patch).length === 0) return null

    plantsReq.loading = true
    plantsReq.error = null
    try {
      const res = await apiFetch(API_PATHS.plants.byId(plantId))
        .put(patch, 'json')
        .json<unknown>()

      const apiResult = toApiResult<unknown>(res)
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

  const upsertPlant = (plant: PlantDto) => {
    const idx = plants.value.findIndex((p) => p.id === plant.id)
    if (idx === -1) {
      plants.value = [...plants.value, plant]
      return
    }

    const next = [...plants.value]
    next[idx] = plant
    plants.value = next
  }

  const addEvent = async (
    event: CreateEventRequest & { plantId: PlantDto['id'] },
  ) => {
    eventsReq.loading = true
    eventsReq.error = null
    try {
      const { plantId, ...body } = event
      const res = await apiFetch(API_PATHS.plants.events(plantId))
        .post(body, 'json')
        .json<unknown>()

      const apiResult = toApiResult<unknown>(res)
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
      const res = await apiFetch(API_PATHS.plants.eventById(plantId, eventId))
        .delete()
        .text()

      const apiResult = toApiResult(res)
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

  const removeSchedule = async (plantId: number, scheduleId: string) => {
    const p = plants.value.find((plant) => plant.id === plantId)
    if (!p) return

    const nextSchedules = p.schedules.filter((t) => t.id !== scheduleId)

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
    removePlant,
    addEvent,
    removeEvent,
    upsertPlant,
    updatePlant,
    removeSchedule,
    clear,
  }
})
