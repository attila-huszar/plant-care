export type ApiValidationError = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

export type ApiErrorBody = {
  error?: string
  validation?: ApiValidationError
}
