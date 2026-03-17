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
import type { ApiResult } from '@plant-care/shared'
import { useApiFetch, withAuth } from '@/composables'
import { toApiResult } from '@/utils'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const canRefresh = ref(true)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => accessToken.value !== null)

  const clearAuth = () => {
    accessToken.value = null
    error.value = null
  }

  const refresh = async (): Promise<string | null> => {
    if (!canRefresh.value) return null

    try {
      const res = await useApiFetch(API_PATHS.users.refresh)
        .post()
        .json<{ accessToken: string | null }>()

      const result = toApiResult<{ accessToken: string | null }>(res)

      if (!result.ok) {
        return null
      }

      if (!result.data.accessToken) {
        canRefresh.value = false
        clearAuth()
        return null
      }

      canRefresh.value = true
      accessToken.value = result.data.accessToken

      return accessToken.value
    } catch {
      return null
    }
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
    try {
      const res = await useApiFetch(API_PATHS.users.login)
        .post(payload, 'json')
        .json<
          | { mfaPending: true; email: string }
          | { accessToken: string; firstName: string }
        >()

      const result = toApiResult<
        | { mfaPending: true; email: string }
        | { accessToken: string; firstName: string }
      >(res)

      if (!result.ok) {
        error.value = result.error
        return result
      }

      if ('accessToken' in result.data) {
        accessToken.value = result.data.accessToken
        canRefresh.value = true
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  const mfaVerify = async (
    payload: MfaVerifyRequest,
  ): Promise<ApiResult<{ accessToken: string; firstName: string }>> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.mfaVerify)
        .post(payload, 'json')
        .json<{ accessToken: string; firstName: string }>()

      const result = toApiResult<{ accessToken: string; firstName: string }>(
        res,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      accessToken.value = result.data.accessToken
      canRefresh.value = true
      return result
    } finally {
      isLoading.value = false
    }
  }

  const register = async (
    payload: RegisterRequest,
  ): Promise<ApiResult<{ email: string }>> => {
    const formData = new FormData()
    formData.set('firstName', payload.firstName)
    formData.set('lastName', payload.lastName)
    formData.set('email', payload.email)
    formData.set('password', payload.password)

    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.register)
        .post(formData)
        .json<{ email: string }>()

      const result = toApiResult<{ email: string }>(res)
      if (!result.ok) error.value = result.error
      return result
    } finally {
      isLoading.value = false
    }
  }

  const verifyEmail = async (
    payload: VerificationRequest,
  ): Promise<ApiResult<{ email: string }>> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.verification)
        .post(payload, 'json')
        .json<{ email: string }>()

      const result = toApiResult<{ email: string }>(res)
      if (!result.ok) error.value = result.error
      return result
    } finally {
      isLoading.value = false
    }
  }

  const requestPasswordReset = async (
    payload: PasswordResetRequest,
  ): Promise<ApiResult<{ message: string }>> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.passwordResetRequest)
        .post(payload, 'json')
        .json<{ message: string }>()

      const result = toApiResult<{ message: string }>(res)
      if (!result.ok) error.value = result.error
      return result
    } finally {
      isLoading.value = false
    }
  }

  const validatePasswordResetToken = async (
    payload: PasswordResetToken,
  ): Promise<ApiResult<{ token: string }>> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.passwordResetToken)
        .post(payload, 'json')
        .json<{ token: string }>()

      const result = toApiResult<{ token: string }>(res)
      if (!result.ok) error.value = result.error
      return result
    } finally {
      isLoading.value = false
    }
  }

  const submitPasswordReset = async (
    payload: PasswordResetSubmit,
  ): Promise<ApiResult<{ message: string }>> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await useApiFetch(API_PATHS.users.passwordResetSubmit)
        .post(payload, 'json')
        .json<{ message: string }>()

      const result = toApiResult<{ message: string }>(res)
      if (!result.ok) error.value = result.error
      return result
    } finally {
      isLoading.value = false
    }
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
    canRefresh.value = false
  }

  return {
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    refresh,
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
