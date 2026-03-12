import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  LoginRequest,
  PasswordResetRequest,
  PasswordResetSubmit,
  PasswordResetToken,
  RegisterRequest,
  VerificationRequest,
} from '@plant-care/shared'
import {
  type ApiErrorBody,
  type ApiValidationError,
  useApiFetch,
  withAuth,
} from '@/composables'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const profile = ref<PublicUser | null>(null)
  const bootstrapped = ref(false)

  const isAuthenticated = computed(
    () => accessToken.value !== null && profile.value !== null,
  )

  let bootstrapPromise: Promise<void> | null = null

  const clearAuth = () => {
    accessToken.value = null
    profile.value = null
  }

  const toApiError = (body: unknown): ApiErrorBody | null => {
    if (!body || typeof body !== 'object') return null
    const maybe = body as Record<string, unknown>

    const error = typeof maybe.error === 'string' ? maybe.error : undefined
    const validation = maybe.validation as ApiValidationError | undefined

    if (!error && !validation) return null
    return { error, validation }
  }

  const toResult = <T>(params: {
    response: Response | null
    body: unknown
    fetchError: unknown
  }): AuthResult<T> => {
    if (!params.response) {
      return {
        ok: false,
        status: null,
        error:
          params.fetchError instanceof Error
            ? params.fetchError.message
            : 'Network error',
      }
    }

    if (params.response.ok) {
      return { ok: true, data: params.body as T }
    }

    const apiError = toApiError(params.body)

    return {
      ok: false,
      status: params.response.status,
      error: apiError?.error ?? 'Request failed',
      validation: apiError?.validation,
    }
  }

  const refresh = async (): Promise<string | null> => {
    const res = await useApiFetch('/users/refresh')
      .post()
      .json<{ accessToken: string | null }>()

    const result = toResult<{ accessToken: string | null }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok) {
      clearAuth()
      return null
    }

    accessToken.value = result.data.accessToken
    if (!accessToken.value) profile.value = null

    return accessToken.value
  }

  const getProfile = async (): Promise<AuthResult<PublicUser>> => {
    const res = await useApiFetch('/users/profile', withAuth(accessToken))
      .get()
      .json<PublicUser>()

    let result = toResult<PublicUser>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok && result.status === 401) {
      const token = await refresh()
      if (!token) return result

      const retry = await useApiFetch('/users/profile', withAuth(accessToken))
        .get()
        .json<PublicUser>()

      result = toResult<PublicUser>({
        response: retry.response.value,
        body: retry.data.value,
        fetchError: retry.error.value,
      })
    }

    if (result.ok) {
      profile.value = result.data
    } else {
      clearAuth()
    }

    return result
  }

  const bootstrap = async () => {
    if (bootstrapped.value) return
    if (bootstrapPromise) return bootstrapPromise

    bootstrapPromise = (async () => {
      const token = await refresh()
      if (!token) {
        bootstrapped.value = true
        return
      }

      await getProfile()
      bootstrapped.value = true
    })().finally(() => {
      bootstrapPromise = null
    })

    return bootstrapPromise
  }

  const login = async (
    payload: LoginRequest,
  ): Promise<AuthResult<PublicUser>> => {
    const res = await useApiFetch('/users/login')
      .post(payload, 'json')
      .json<{ accessToken: string }>()

    const result = toResult<{ accessToken: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok) {
      return result as AuthResult<PublicUser>
    }

    accessToken.value = result.data.accessToken
    const profileResult = await getProfile()
    return profileResult
  }

  const register = async (
    payload: RegisterRequest,
  ): Promise<AuthResult<{ email: string }>> => {
    const formData = new FormData()
    formData.set('firstName', payload.firstName)
    formData.set('lastName', payload.lastName)
    formData.set('email', payload.email)
    formData.set('password', payload.password)

    const res = await useApiFetch('/users/register').post(formData).json<{
      email: string
    }>()

    return toResult<{ email: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
  }

  const verifyEmail = async (
    payload: VerificationRequest,
  ): Promise<AuthResult<{ email: string }>> => {
    const res = await useApiFetch('/users/verification')
      .post(payload, 'json')
      .json<{ email: string }>()

    return toResult<{ email: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
  }

  const requestPasswordReset = async (
    payload: PasswordResetRequest,
  ): Promise<AuthResult<{ message: string }>> => {
    const res = await useApiFetch('/users/password-reset-request')
      .post(payload, 'json')
      .json<{ message: string }>()

    return toResult<{ message: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
  }

  const validatePasswordResetToken = async (
    payload: PasswordResetToken,
  ): Promise<AuthResult<{ token: string }>> => {
    const res = await useApiFetch('/users/password-reset-token')
      .post(payload, 'json')
      .json<{ token: string }>()

    return toResult<{ token: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
  }

  const submitPasswordReset = async (
    payload: PasswordResetSubmit,
  ): Promise<AuthResult<{ message: string }>> => {
    const res = await useApiFetch('/users/password-reset-submit')
      .post(payload, 'json')
      .json<{ message: string }>()

    return toResult<{ message: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
  }

  const logout = async () => {
    if (accessToken.value) {
      await useApiFetch('/users/logout', withAuth(accessToken)).post().json()
    }

    clearAuth()
    bootstrapped.value = true
  }

  return {
    accessToken,
    profile,
    bootstrapped,
    isAuthenticated,
    bootstrap,
    login,
    register,
    verifyEmail,
    requestPasswordReset,
    validatePasswordResetToken,
    submitPasswordReset,
    logout,
  }
})

type PublicUser = {
  uuid: string
  firstName: string
  lastName: string
  email: string
}

type AuthResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      status: number | null
      error: string
      validation?: ApiValidationError
    }
