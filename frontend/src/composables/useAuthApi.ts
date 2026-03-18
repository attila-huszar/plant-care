import type { MaybeRefOrGetter } from 'vue'
import type { ApiResult } from '@plant-care/shared'
import { useAuthStore } from '@/features/auth/stores'
import { type FetchResultLike, toApiResult } from '@/utils'
import { useApiFetch, withAuth } from './useApiFetch'

type AuthRetryOptions = { retryOnStatuses?: readonly number[] }

let refreshInFlight: Promise<string | null> | null = null

export const createAuthApi = (
  accessToken: MaybeRefOrGetter<string | null>,
  refresh: () => Promise<string | null>,
) => {
  const fetchWithAuthRetry = async <T>(
    makeRequest: () => PromiseLike<FetchResultLike>,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<T>> => {
    const retryOnStatuses = options?.retryOnStatuses ?? [401, 403]

    try {
      const res = await makeRequest()
      let result = toApiResult<T>(res)

      if (
        !result.ok &&
        result.status &&
        retryOnStatuses.includes(result.status)
      ) {
        refreshInFlight ??= refresh()
          .catch(() => null)
          .finally(() => {
            refreshInFlight = null
          })

        const token = await refreshInFlight
        if (!token) return result

        const retry = await makeRequest()
        result = toApiResult<T>(retry)
      }

      return result
    } catch (e) {
      return {
        ok: false,
        status: null,
        error: e instanceof Error ? e.message : 'Network error',
      }
    }
  }

  const getJson = async <T>(
    path: string,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<T>> => {
    return fetchWithAuthRetry<T>(
      () => useApiFetch(path, withAuth(accessToken)).get().json<T>(),
      options,
    )
  }

  const postJson = async <T>(
    path: string,
    payload?: unknown,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<T>> => {
    return fetchWithAuthRetry<T>(
      () =>
        useApiFetch(path, withAuth(accessToken))
          .post(payload ?? {}, 'json')
          .json<T>(),
      options,
    )
  }

  const putJson = async <T>(
    path: string,
    payload: unknown,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<T>> => {
    return fetchWithAuthRetry<T>(
      () =>
        useApiFetch(path, withAuth(accessToken)).put(payload, 'json').json<T>(),
      options,
    )
  }

  const patchJson = async <T>(
    path: string,
    payload: unknown,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<T>> => {
    return fetchWithAuthRetry<T>(
      () =>
        useApiFetch(path, withAuth(accessToken))
          .patch(payload, 'json')
          .json<T>(),
      options,
    )
  }

  const deleteText = async (
    path: string,
    options?: AuthRetryOptions,
  ): Promise<ApiResult<string>> => {
    return fetchWithAuthRetry<string>(
      () => useApiFetch(path, withAuth(accessToken)).delete().text(),
      options,
    )
  }

  return {
    getJson,
    postJson,
    putJson,
    patchJson,
    deleteText,
    fetchWithAuthRetry,
  }
}

export const useAuthApi = () => {
  const authStore = useAuthStore()
  return createAuthApi(() => authStore.accessToken, authStore.refresh)
}

export const resetRefreshInFlight = () => {
  refreshInFlight = null
}
