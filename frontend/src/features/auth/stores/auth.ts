import { computed, ref } from 'vue'
import { API_PATHS } from '@/constants'
import { defineStore } from 'pinia'
import type {
  LoginRequest,
  MfaVerifyRequest,
  PasswordResetRequest,
  PasswordResetSubmit,
  PasswordResetToken,
  RegisterRequest,
  VerificationRequest,
} from '@plant-care/shared'
import { useApiFetch, withAuth } from '@/composables'
import { type ApiResult, toResult } from '@/utils'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const bootstrapped = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => accessToken.value !== null)

  let bootstrapPromise: Promise<void> | null = null

  const clearAuth = () => {
    accessToken.value = null
    error.value = null
  }

  // Uses shared result helpers from `@/lib/apiResult`.

  const refresh = async (): Promise<string | null> => {
    const res = await useApiFetch(API_PATHS.users.refresh)
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

    return accessToken.value
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
      bootstrapped.value = true
    })().finally(() => {
      bootstrapPromise = null
    })

    return bootstrapPromise
  }

  const login = async (
    payload: LoginRequest,
  ): Promise<
    ApiResult<
      | { mfaPending: true; email: string }
      | { accessToken: string; firstName: string }
    >
  > => {
    isLoading.value = true
    error.value = null
    const res = await useApiFetch(API_PATHS.users.login)
      .post(payload, 'json')
      .json<
        | { mfaPending: true; email: string }
        | { accessToken: string; firstName: string }
      >()

    const result = toResult<
      | { mfaPending: true; email: string }
      | { accessToken: string; firstName: string }
    >({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok) {
      error.value = result.error
      isLoading.value = false
      return result
    }

    if ('accessToken' in result.data) {
      accessToken.value = result.data.accessToken
    }
    isLoading.value = false
    return result
  }

  const mfaVerify = async (
    payload: MfaVerifyRequest,
  ): Promise<ApiResult<{ accessToken: string; firstName: string }>> => {
    isLoading.value = true
    error.value = null

    const res = await useApiFetch(API_PATHS.users.mfaVerify)
      .post(payload, 'json')
      .json<{ accessToken: string; firstName: string }>()

    const result = toResult<{ accessToken: string; firstName: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })

    if (!result.ok) {
      error.value = result.error
      isLoading.value = false
      return result
    }

    accessToken.value = result.data.accessToken
    isLoading.value = false
    return result
  }

  const register = async (
    payload: RegisterRequest,
  ): Promise<ApiResult<{ email: string }>> => {
    isLoading.value = true
    error.value = null
    const formData = new FormData()
    formData.set('firstName', payload.firstName)
    formData.set('lastName', payload.lastName)
    formData.set('email', payload.email)
    formData.set('password', payload.password)

    const res = await useApiFetch(API_PATHS.users.register)
      .post(formData)
      .json<{
        email: string
      }>()

    const result = toResult<{ email: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
    if (!result.ok) error.value = result.error
    isLoading.value = false
    return result
  }

  const verifyEmail = async (
    payload: VerificationRequest,
  ): Promise<ApiResult<{ email: string }>> => {
    isLoading.value = true
    error.value = null
    const res = await useApiFetch(API_PATHS.users.verification)
      .post(payload, 'json')
      .json<{ email: string }>()

    const result = toResult<{ email: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
    if (!result.ok) error.value = result.error
    isLoading.value = false
    return result
  }

  const requestPasswordReset = async (
    payload: PasswordResetRequest,
  ): Promise<ApiResult<{ message: string }>> => {
    isLoading.value = true
    error.value = null
    const res = await useApiFetch(API_PATHS.users.passwordResetRequest)
      .post(payload, 'json')
      .json<{ message: string }>()

    const result = toResult<{ message: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
    if (!result.ok) error.value = result.error
    isLoading.value = false
    return result
  }

  const validatePasswordResetToken = async (
    payload: PasswordResetToken,
  ): Promise<ApiResult<{ token: string }>> => {
    isLoading.value = true
    error.value = null
    const res = await useApiFetch(API_PATHS.users.passwordResetToken)
      .post(payload, 'json')
      .json<{ token: string }>()

    const result = toResult<{ token: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
    if (!result.ok) error.value = result.error
    isLoading.value = false
    return result
  }

  const submitPasswordReset = async (
    payload: PasswordResetSubmit,
  ): Promise<ApiResult<{ message: string }>> => {
    isLoading.value = true
    error.value = null
    const res = await useApiFetch(API_PATHS.users.passwordResetSubmit)
      .post(payload, 'json')
      .json<{ message: string }>()

    const result = toResult<{ message: string }>({
      response: res.response.value,
      body: res.data.value,
      fetchError: res.error.value,
    })
    if (!result.ok) error.value = result.error
    isLoading.value = false
    return result
  }

  const logout = async () => {
    if (!accessToken.value) {
      await refresh()
    }

    if (accessToken.value) {
      await useApiFetch(API_PATHS.users.logout, withAuth(accessToken))
        .post()
        .json()
    }

    clearAuth()
    bootstrapped.value = true
  }

  return {
    accessToken,
    bootstrapped,
    isAuthenticated,
    isLoading,
    error,
    refresh,
    bootstrap,
    login,
    mfaVerify,
    register,
    verifyEmail,
    requestPasswordReset,
    validatePasswordResetToken,
    submitPasswordReset,
    logout,
  }
})
