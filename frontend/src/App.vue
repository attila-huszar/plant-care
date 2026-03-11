<script setup lang="ts">
  import { useAuthStore } from './features/auth/stores/auth'
  import LoginView from './features/auth/views/LoginView.vue'
  import DashboardView from './features/diary/views/DashboardView.vue'

  const authStore = useAuthStore()
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-linear-to-br from-green-50 to-emerald-100 font-sans text-slate-800 selection:bg-emerald-500 selection:text-white dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
  >
    <!-- Main routing equivalent -->
    <Transition name="fade" mode="out-in">
      <LoginView v-if="!authStore.isAuthenticated" />
      <DashboardView v-else />
    </Transition>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity 0.4s ease,
      transform 0.4s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
</style>
