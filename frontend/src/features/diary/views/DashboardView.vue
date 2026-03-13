<script setup lang="ts">
  import { ref } from 'vue'
  import { useDark } from '@vueuse/core'
  import { Switch } from '@headlessui/vue'
  import { useRouter } from 'vue-router'
  import type { EventType } from '@plant-care/shared'
  import { MoonIcon, PlantIcon, SunIcon } from '@/assets/svg'
  import { useAuthStore } from '../../auth/stores/auth'
  import { EventTimeline, PlantList, PlantModal } from '../components'
  import { useDiaryStore } from '../stores/diary'

  const authStore = useAuthStore()
  const router = useRouter()
  const diaryStore = useDiaryStore()
  const isDark = useDark({
    storageKey: 'plant-care-theme-dark',
    valueDark: 'dark',
  })

  const isPlantModalOpen = ref(false)
  const plantModalPlantId = ref<number | null>(null)

  const handleLogout = async () => {
    await authStore.logout()
    await router.push('/login')
  }

  const openAddPlantModal = () => {
    plantModalPlantId.value = null
    isPlantModalOpen.value = true
  }

  const openEditPlantModal = (payload: { plantId: number }) => {
    plantModalPlantId.value = payload.plantId
    isPlantModalOpen.value = true
  }

  const closePlantModal = () => {
    isPlantModalOpen.value = false
    plantModalPlantId.value = null
  }

  const handleCompleteCare = (payload: {
    plantId: number
    typeId: EventType
    scheduledCareId?: string
  }) => {
    diaryStore.addEvent({
      plantId: payload.plantId,
      typeId: payload.typeId,
      notes: '',
      date: new Date().toISOString(),
    })

    if (payload.scheduledCareId) {
      diaryStore.removeScheduledCareItem(
        payload.plantId,
        payload.scheduledCareId,
      )
    }
  }
</script>

<template>
  <div
    class="flex min-h-screen flex-1 flex-col bg-slate-50/50 dark:bg-slate-950"
  >
    <!-- Navbar -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-emerald-100 bg-white/70 px-6 py-4 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div class="flex items-center gap-3">
        <span
          class="inline-flex h-10 w-10 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_20px_currentColor)]"
        >
          <img :src="PlantIcon" alt="" aria-hidden="true" class="h-10 w-10" />
        </span>
        <h1
          class="hidden text-xl font-bold text-emerald-900 sm:block dark:text-slate-100"
        >
          My Plant Diary
        </h1>
      </div>

      <div class="flex items-center gap-4">
        <Switch
          v-model="isDark"
          class="relative inline-flex h-8 w-14 items-center rounded-full transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-slate-950"
          :class="isDark ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'"
        >
          <span class="sr-only">Toggle dark mode</span>
          <span
            class="inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white transition"
            :class="isDark ? 'translate-x-7' : 'translate-x-1'"
          >
            <img
              :src="isDark ? MoonIcon : SunIcon"
              alt=""
              class="h-4 w-4"
              aria-hidden="true"
            />
          </span>
        </Switch>
        <span
          class="rounded-full border border-emerald-200 bg-emerald-100/50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
        >
          Hello, {{ authStore.profile?.firstName ?? authStore.profile?.email }}
        </span>
        <button
          @click="handleLogout"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/30"
        >
          Log Out
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-8 p-6 lg:grid-cols-3 lg:p-10"
    >
      <div class="lg:col-span-2">
        <PlantList
          :plants="diaryStore.plants"
          :events="diaryStore.events"
          :customEvents="diaryStore.customEvents"
          @add-plant="openAddPlantModal"
          @edit-plant="openEditPlantModal"
        />
      </div>
      <div class="h-full min-h-100">
        <EventTimeline
          :plants="diaryStore.plants"
          :events="diaryStore.events"
          :customEvents="diaryStore.customEvents"
          @complete-care="handleCompleteCare"
        />
      </div>
    </main>

    <!-- Modals -->
    <PlantModal
      :is-open="isPlantModalOpen"
      :plant-id="plantModalPlantId"
      @close="closePlantModal"
    />
  </div>
</template>
