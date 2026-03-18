import type { ApiResult } from '@plant-care/shared'
import { type FetchResultLike, toApiResult } from '@/utils'
import { useApiFetch } from './useApiFetch'

export const usePublicApi = () => {
  const request = async <T>(
    makeRequest: () => PromiseLike<FetchResultLike>,
  ): Promise<ApiResult<T>> => {
    try {
      const res = await makeRequest()
      return toApiResult<T>(res)
    } catch (e) {
      return {
        ok: false,
        status: null,
        error: e instanceof Error ? e.message : 'Network error',
      }
    }
  }

  const getJson = async <T>(path: string): Promise<ApiResult<T>> => {
    return request<T>(() => useApiFetch(path).get().json<T>())
  }

  function postJson<T>(path: string, payload: FormData): Promise<ApiResult<T>>
  function postJson<T>(path: string, payload?: unknown): Promise<ApiResult<T>>

  async function postJson<T>(
    path: string,
    payload?: unknown,
  ): Promise<ApiResult<T>> {
    return request<T>(() => {
      const req = useApiFetch(path)

      if (payload instanceof FormData) {
        return req.post(payload).json<T>()
      }

      return req.post(payload ?? {}, 'json').json<T>()
    })
  }

  return { getJson, postJson, request }
}
