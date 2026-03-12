import { type MaybeRefOrGetter, toValue } from 'vue'
import {
  type BeforeFetchContext,
  createFetch,
  type UseFetchOptions,
} from '@vueuse/core'

export type ApiValidationError = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

export type ApiErrorBody = {
  error?: string
  validation?: ApiValidationError
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'

export const useApiFetch = createFetch({
  baseUrl: API_BASE_URL,
  fetchOptions: {
    credentials: 'include',
  },
  options: {
    updateDataOnError: true,
  },
})

export function withAuth(
  accessToken: MaybeRefOrGetter<string | null>,
): UseFetchOptions {
  return {
    beforeFetch(ctx: BeforeFetchContext) {
      const headers = new Headers(ctx.options.headers)
      headers.set('accept', 'application/json')

      const token = toValue(accessToken)
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }

      return {
        options: {
          ...ctx.options,
          headers,
        },
      }
    },
  }
}
