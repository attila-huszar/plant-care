<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { RouterLink, useRoute } from 'vue-router'
  import { tokenSchema } from '@plant-care/shared'
  import { PlantIcon } from '@/assets/svg'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()
  const route = useRoute()

  const state = ref<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; email: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  const token = computed(() =>
    typeof route.query.token === 'string' ? route.query.token : null,
  )

  onMounted(async () => {
    const parsed = tokenSchema.safeParse({ token: token.value })
    if (!parsed.success) {
      state.value = {
        status: 'error',
        message: 'Invalid verification token',
      }
      return
    }

    state.value = { status: 'loading' }
    const result = await authStore.verifyEmail(parsed.data)

    if (!result.ok) {
      state.value = { status: 'error', message: result.error }
      return
    }

    state.value = { status: 'success', email: result.data.email }
  })
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-6">
    <div
      class="w-full max-w-md rounded-3xl border border-white/40 bg-white/60 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <span
        class="mx-auto mb-6 inline-flex h-20 w-20 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_24px_currentColor)]"
      >
        <img :src="PlantIcon" alt="" aria-hidden="true" class="h-20 w-20" />
      </span>

      <h1
        class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
      >
        Email Verification
      </h1>

      <p
        v-if="state.status === 'loading'"
        class="text-emerald-700/70 dark:text-slate-300"
      >
        Verifying your email...
      </p>

      <div
        v-else-if="state.status === 'success'"
        class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100"
      >
        <p class="font-medium">Verified!</p>
        <p class="mt-1 opacity-90">
          You can now sign in with
          <span class="font-semibold">{{ state.email }}</span
          >.
        </p>
      </div>

      <div
        v-else-if="state.status === 'error'"
        class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
      >
        {{ state.message }}
      </div>

      <RouterLink
        to="/login"
        class="mt-8 inline-flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500"
      >
        Go to login
      </RouterLink>
    </div>
  </div>
</template>
