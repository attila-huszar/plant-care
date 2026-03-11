<script setup lang="ts">
  import { ref } from 'vue'
  import PlantUrl from '../../../assets/svg/plant.svg?url'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()
  const username = ref('')

  const handleLogin = () => {
    if (username.value.trim()) {
      authStore.login(username.value.trim())
    }
  }
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-6">
    <div
      class="w-full max-w-md transform rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <!-- Brand Header -->
      <div class="mb-10 text-center">
        <span
          class="mx-auto mb-6 inline-flex h-20 w-20 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_24px_currentColor)]"
        >
          <img :src="PlantUrl" alt="" aria-hidden="true" class="h-20 w-20" />
        </span>
        <h1
          class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
        >
          Plant Care Diary
        </h1>
        <p class="text-emerald-700/70 dark:text-slate-300">
          Sign in to track your green friends
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label
            for="username"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >Username</label
          >
          <input
            v-model="username"
            id="username"
            type="text"
            required
            placeholder="e.g. PlantLover99"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <button
          type="submit"
          class="flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-95"
        >
          Enter Diary
        </button>
      </form>
    </div>
  </div>
</template>
