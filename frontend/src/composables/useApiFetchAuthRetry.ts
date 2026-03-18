import type { ApiResult } from '@plant-care/shared'
import { useAuthStore } from '@/features/auth/stores'
import { type FetchResultLike, toApiResult } from '@/utils'

export const useApiFetchAuthRetry = () => {
  const authStore = useAuthStore()

  const fetchWithAuthRetry = async <T>(
    makeRequest: () => PromiseLike<FetchResultLike>,
    options?: { retryOnStatuses?: readonly number[] },
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
        const token = await authStore.refresh()
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

  return { fetchWithAuthRetry }
}
