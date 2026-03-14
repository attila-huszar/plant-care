import { computed, ref, watch } from 'vue'
import { API_PATHS } from '@/constants'
import { defineStore } from 'pinia'
import type { CustomEventDto, PublicUser } from '@plant-care/shared'
import { useApiFetch, withAuth } from '@/composables'
import { type ApiResult, toResult } from '@/utils'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', () => {
  const profile = ref<PublicUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const customEvents = ref<CustomEventDto[]>([])
  const customEventsLoading = ref(false)
  const customEventsError = ref<string | null>(null)

  const bootstrapped = ref(false)
  let bootstrapPromise: Promise<void> | null = null

  const authStore = useAuthStore()

  const isReady = computed(() => profile.value !== null)

  const clear = () => {
    profile.value = null
    isLoading.value = false
    error.value = null
    customEvents.value = []
    customEventsLoading.value = false
    customEventsError.value = null
    bootstrapped.value = false
  }

  watch(
    () => authStore.accessToken,
    (token) => {
      if (token) return
      clear()
    },
  )

  // Uses shared result helpers from `@/lib/apiResult`.

  const getWithAuthRetry = async <T>(path: string): Promise<ApiResult<T>> => {
    const res = await useApiFetch(path, withAuth(authStore.accessToken))
      .get()
      .json<T>()

    let result = toResult<T>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok && result.status === 401) {
      const token = await authStore.refresh()
      if (!token) return result

      const retry = await useApiFetch(path, withAuth(authStore.accessToken))
        .get()
        .json<T>()

      result = toResult<T>({
        response: retry.response.value,
        body: retry.data.value,
        fetchError: retry.error.value,
      })
    }

    return result
  }

  const loadProfile = async (): Promise<ApiResult<PublicUser>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await getWithAuthRetry<PublicUser>(API_PATHS.users.profile)
      if (result.ok) {
        profile.value = result.data
      } else {
        profile.value = null
        error.value = result.error
      }
      return result
    } finally {
      isLoading.value = false
    }
  }

  const loadCustomEvents = async (): Promise<ApiResult<CustomEventDto[]>> => {
    customEventsLoading.value = true
    customEventsError.value = null
    try {
      const result = await getWithAuthRetry<{
        customEvents?: CustomEventDto[]
      }>(API_PATHS.users.customEvents)

      if (!result.ok) {
        customEventsError.value = result.error
        return result
      }

      customEvents.value = result.data.customEvents ?? []
      return { ok: true, data: customEvents.value }
    } finally {
      customEventsLoading.value = false
    }
  }

  const createCustomEvent = async (
    name: string,
  ): Promise<ApiResult<CustomEventDto>> => {
    const trimmed = name.trim()
    if (!trimmed) {
      return { ok: false, status: null, error: 'Name is required' }
    }

    const existing = customEvents.value.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) return { ok: true, data: existing }

    customEventsLoading.value = true
    customEventsError.value = null
    try {
      const res = await useApiFetch(
        API_PATHS.users.customEvents,
        withAuth(authStore.accessToken),
      )
        .post({ name: trimmed }, 'json')
        .json<CustomEventDto>()

      let result = toResult<CustomEventDto>({
        response: res.response.value,
        body: res.data.value,
        fetchError: res.error.value,
      })

      if (!result.ok && result.status === 401) {
        const token = await authStore.refresh()
        if (!token) {
          customEventsError.value = result.error
          return result
        }

        const retry = await useApiFetch(
          API_PATHS.users.customEvents,
          withAuth(authStore.accessToken),
        )
          .post({ name: trimmed }, 'json')
          .json<CustomEventDto>()

        result = toResult<CustomEventDto>({
          response: retry.response.value,
          body: retry.data.value,
          fetchError: retry.error.value,
        })
      }

      if (!result.ok) {
        customEventsError.value = result.error
        return result
      }

      if (!customEvents.value.some((t) => t.id === result.data.id)) {
        customEvents.value = [...customEvents.value, result.data]
      }
      return result
    } finally {
      customEventsLoading.value = false
    }
  }

  const bootstrap = async () => {
    if (bootstrapped.value) return
    if (bootstrapPromise) return bootstrapPromise

    bootstrapPromise = (async () => {
      if (!authStore.accessToken) {
        bootstrapped.value = true
        return
      }

      const profileResult = await loadProfile()
      if (!profileResult.ok) {
        bootstrapped.value = true
        return
      }

      await loadCustomEvents()
      bootstrapped.value = true
    })().finally(() => {
      bootstrapPromise = null
    })

    return bootstrapPromise
  }

  return {
    profile,
    isReady,
    bootstrapped,
    isLoading,
    error,
    customEvents,
    customEventsLoading,
    customEventsError,
    bootstrap,
    loadProfile,
    loadCustomEvents,
    createCustomEvent,
    clear,
  }
})
