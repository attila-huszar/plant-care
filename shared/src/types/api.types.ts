export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      status: number | null
      error: string
      validation?: ApiValidationError
    }

export type ApiValidationError = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

export type ApiErrorBody = {
  error?: string
  validation?: ApiValidationError
}
