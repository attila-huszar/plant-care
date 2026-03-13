import { computed, ref } from 'vue'
import { API_PATHS } from '@/constants'
import { defineStore } from 'pinia'
import {
  careRuleSchema,
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

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<PlantDto[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const eventsLoading = ref(false)
  const eventsError = ref<string | null>(null)

  const setError = (message: string | null) => {
    error.value = message
  }

  const setEventsError = (message: string | null) => {
    eventsError.value = message
  }

  const authStore = useAuthStore()

  const apiFetch = (path: string) => {
    return useApiFetch(path, withAuth(authStore.accessToken))
  }

  const runRequest = async <T>(
    loadingRef: { value: boolean },
    setErrorFn: (message: string | null) => void,
    errorMessage: string,
    task: () => Promise<T | null>,
  ) => {
    loadingRef.value = true
    setErrorFn(null)
    try {
      const result = await task()
      if (result === null) {
        setErrorFn(errorMessage)
        return null
      }
      return result
    } catch (e) {
      console.error(errorMessage, e)
      setErrorFn(errorMessage)
      return null
    } finally {
      loadingRef.value = false
    }
  }

  const setPlants = (next: PlantDto[]) => {
    plants.value = next
  }

  const events = computed(() => {
    return plants.value.flatMap((p) => p.history)
  })

  const upsertPlant = (plant: PlantDto) => {
    const idx = plants.value.findIndex((p) => p.id === plant.id)
    if (idx === -1) {
      plants.value = [...plants.value, plant]
      return
    }
    plants.value = plants.value.map((p) => (p.id === plant.id ? plant : p))
  }

  const removeEventFromPlants = (eventId: number) => {
    plants.value = plants.value.map((p) => ({
      ...p,
      history: p.history.filter((e) => e.id !== eventId),
    }))
  }

  const addEvent = async (
    event: CreateEventRequest & { plantId: PlantDto['id'] },
  ) => {
    return runRequest(
      eventsLoading,
      setEventsError,
      'Failed to add event',
      async () => {
        const { plantId, ...body } = event
        const res = await apiFetch(API_PATHS.plants.events(plantId))
          .post(body, 'json')
          .json<unknown>()

        if (res.response.value?.ok && res.data.value) {
          const data = validate(createEventResponseSchema, res.data.value)
          upsertPlant(data.plant)
          return data.event
        }

        return null
      },
    )
  }

  const removeEvent = async (plantId: number, eventId: number) => {
    return runRequest(
      eventsLoading,
      setEventsError,
      'Failed to remove event',
      async () => {
        const res = await apiFetch(API_PATHS.plants.eventById(plantId, eventId))
          .delete()
          .text()

        if (res.response.value?.ok) {
          removeEventFromPlants(eventId)
          return true
        }

        return null
      },
    )
  }

  const loadPlants = async () => {
    await runRequest(isLoading, setError, 'Failed to load plants', async () => {
      const res = await apiFetch(API_PATHS.plants.root).get().json<unknown>()

      if (!res.response.value?.ok) {
        return null
      }

      const data = validate(listPlantsResponseSchema, res.data.value)
      setPlants(data.plants)
      return true
    })
  }

  const addPlant = async (plant: CreatePlantRequest) => {
    return runRequest(isLoading, setError, 'Failed to add plant', async () => {
      const res = await apiFetch(API_PATHS.plants.root)
        .post(plant, 'json')
        .json<unknown>()

      if (res.response.value?.ok && res.data.value) {
        const data = validate(plantDtoSchema, res.data.value)
        upsertPlant(data)
        return data
      }

      return null
    })
  }

  const removePlant = async (id: number) => {
    return runRequest(
      isLoading,
      setError,
      'Failed to remove plant',
      async () => {
        const res = await apiFetch(API_PATHS.plants.byId(id)).delete().text()

        if (res.response.value?.ok) {
          plants.value = plants.value.filter((p) => p.id !== id)
          return true
        }

        return null
      },
    )
  }

  const updatePlant = async (plantId: number, patch: UpdatePlantRequest) => {
    if (!patch || Object.keys(patch).length === 0) return null

    return runRequest(
      isLoading,
      setError,
      'Failed to update plant',
      async () => {
        const res = await apiFetch(API_PATHS.plants.byId(plantId))
          .put(patch, 'json')
          .json<unknown>()

        if (res.response.value?.ok && res.data.value) {
          const data = validate(plantDtoSchema, res.data.value)
          upsertPlant(data)
          return data
        }

        return null
      },
    )
  }

  const removeCareRuleItem = async (plantId: number, careRuleId: string) => {
    const p = plants.value.find((plant) => plant.id === plantId)
    if (!p) return

    const nextCareRules = (p.careRules ?? [])
      .filter((r) => r.id !== careRuleId)
      .filter((rule) => careRuleSchema.safeParse(rule).success)

    return updatePlant(plantId, { careRules: nextCareRules })
  }

  const clear = () => {
    plants.value = []
    isLoading.value = false
    error.value = null
    eventsLoading.value = false
    eventsError.value = null
  }

  return {
    plants,
    events,
    isLoading,
    error,
    eventsLoading,
    eventsError,
    loadPlants,
    addPlant,
    removePlant,
    addEvent,
    removeEvent,
    upsertPlant,
    updatePlant,
    removeCareRuleItem,
    clear,
  }
})
