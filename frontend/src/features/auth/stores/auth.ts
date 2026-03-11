import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = useLocalStorage<{ username: string } | null>(
    'plant-care-user',
    null,
  )

  const isAuthenticated = computed(() => user.value !== null)

  const login = (username: string) => {
    user.value = { username }
  }

  const logout = () => {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
})
