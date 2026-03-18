import type {
  ApiErrorBody,
  ApiResult,
  ApiValidationError,
} from '@plant-care/shared'

export type FetchResultLike = {
  response: { value: Response | null }
  data: { value: unknown }
  error: { value: unknown }
}

export const toApiResult = <T>(res: FetchResultLike): ApiResult<T> => {
  const response = res.response.value
  const body = res.data.value
  const fetchError = res.error.value

  if (!response) {
    return {
      ok: false,
      status: null,
      error: fetchError instanceof Error ? fetchError.message : 'Network error',
    }
  }

  if (response.ok) {
    return { ok: true, data: body as T }
  }

  const apiError = toApiError(body)

  return {
    ok: false,
    status: response.status,
    error: apiError?.error ?? 'Request failed',
    validation: apiError?.validation,
  }
}

export const toApiError = (body: unknown): ApiErrorBody | null => {
  if (!body || typeof body !== 'object') return null
  const maybe = body as Record<string, unknown>

  const error = typeof maybe.error === 'string' ? maybe.error : undefined
  const validation = maybe.validation as ApiValidationError | undefined

  if (!error && !validation) return null
  return { error, validation }
}
