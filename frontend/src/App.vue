<script setup lang="ts">
  import { useDark } from '@vueuse/core'
  import { RouterView } from 'vue-router'

  useDark({
    storageKey: 'plant-care-theme-dark',
  })
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-linear-to-br from-green-50 to-emerald-100 text-slate-800 selection:bg-emerald-500 selection:text-white dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
  >
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
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
