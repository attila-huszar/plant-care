import type { ApiErrorBody, ApiValidationError } from '@plant-care/shared'

export const toApiError = (body: unknown): ApiErrorBody | null => {
  if (!body || typeof body !== 'object') return null
  const maybe = body as Record<string, unknown>

  const error = typeof maybe.error === 'string' ? maybe.error : undefined
  const validation = maybe.validation as ApiValidationError | undefined

  if (!error && !validation) return null
  return { error, validation }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      status: number | null
      error: string
      validation?: ApiValidationError
    }

export const toResult = <T>(params: {
  response: Response | null
  body: unknown
  fetchError: unknown
}): ApiResult<T> => {
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
