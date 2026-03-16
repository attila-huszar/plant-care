import { type MaybeRefOrGetter, toValue } from 'vue'
import {
  type BeforeFetchContext,
  createFetch,
  type UseFetchOptions,
} from '@vueuse/core'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!apiBaseUrl) {
  throw new Error('Missing required env var: VITE_API_BASE_URL')
}

export const useApiFetch = createFetch({
  baseUrl: apiBaseUrl,
  fetchOptions: {
    credentials: 'include',
    headers: { 'ngrok-skip-browser-warning': 'true' },
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
