import { computed, ref } from 'vue'
import { API_PATHS } from '@/constants'
import { defineStore } from 'pinia'
import {
  loginResponseSchema,
  logoutResponseSchema,
  mfaVerifyResponseSchema,
  passwordResetRequestResponseSchema,
  passwordResetSubmitResponseSchema,
  passwordResetTokenResponseSchema,
  refreshResponseSchema,
  registerResponseSchema,
  safeValidate,
  verificationResponseSchema,
} from '@plant-care/shared'
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordResetSubmit,
  PasswordResetSubmitResponse,
  PasswordResetToken,
  PasswordResetTokenResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  VerificationRequest,
  VerificationResponse,
} from '@plant-care/shared'
import type { ApiResult } from '@plant-care/shared'
import { createAuthApi, usePublicApi } from '@/composables'

export const useAuthStore = defineStore('auth', () => {
  const api = usePublicApi()
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
      const result = await api.postJson<RefreshResponse>(
        API_PATHS.users.refresh,
      )

      if (!result.ok) {
        if (result.status === 401 || result.status === 403) {
          canRefresh.value = false
          clearAuth()
        }
        return null
      }

      const data = safeValidate(refreshResponseSchema, result.data)
      if (!data) {
        canRefresh.value = false
        clearAuth()
        return null
      }

      if (!data.accessToken) {
        canRefresh.value = false
        clearAuth()
        return null
      }

      canRefresh.value = true
      accessToken.value = data.accessToken

      return accessToken.value
    } catch {
      return null
    }
  }

  const authedApi = createAuthApi(accessToken, refresh)

  const login = async (
    payload: LoginRequest,
  ): Promise<ApiResult<LoginResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<LoginResponse>(
        API_PATHS.users.login,
        payload,
      )

      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(loginResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      if ('accessToken' in data) {
        accessToken.value = data.accessToken
        canRefresh.value = true
      } else {
        accessToken.value = null
        canRefresh.value = false
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const mfaVerify = async (
    payload: MfaVerifyRequest,
  ): Promise<ApiResult<MfaVerifyResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<MfaVerifyResponse>(
        API_PATHS.users.mfaVerify,
        payload,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(mfaVerifyResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      accessToken.value = data.accessToken
      canRefresh.value = true
      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (
    payload: RegisterRequest,
  ): Promise<ApiResult<RegisterResponse>> => {
    const formData = new FormData()
    formData.set('firstName', payload.firstName)
    formData.set('lastName', payload.lastName)
    formData.set('email', payload.email)
    formData.set('password', payload.password)

    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<RegisterResponse>(
        API_PATHS.users.register,
        formData,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(registerResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const verifyEmail = async (
    payload: VerificationRequest,
  ): Promise<ApiResult<VerificationResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<VerificationResponse>(
        API_PATHS.users.verification,
        payload,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(verificationResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const requestPasswordReset = async (
    payload: PasswordResetRequest,
  ): Promise<ApiResult<PasswordResetRequestResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<PasswordResetRequestResponse>(
        API_PATHS.users.passwordResetRequest,
        payload,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(passwordResetRequestResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const validatePasswordResetToken = async (
    payload: PasswordResetToken,
  ): Promise<ApiResult<PasswordResetTokenResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<PasswordResetTokenResponse>(
        API_PATHS.users.passwordResetToken,
        payload,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(passwordResetTokenResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const submitPasswordReset = async (
    payload: PasswordResetSubmit,
  ): Promise<ApiResult<PasswordResetSubmitResponse>> => {
    isLoading.value = true
    error.value = null
    try {
      const result = await api.postJson<PasswordResetSubmitResponse>(
        API_PATHS.users.passwordResetSubmit,
        payload,
      )
      if (!result.ok) {
        error.value = result.error
        return result
      }

      const data = safeValidate(passwordResetSubmitResponseSchema, result.data)
      if (!data) {
        const message = 'Invalid server response'
        error.value = message
        return { ok: false, status: null, error: message }
      }

      return { ok: true, data }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    error.value = null

    const result = await authedApi.postJson<LogoutResponse>(
      API_PATHS.users.logout,
    )

    if (!result.ok) {
      error.value = result.error
      return
    }

    const data = safeValidate(logoutResponseSchema, result.data)
    if (!data) {
      const message = 'Invalid server response'
      error.value = message
      return
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
