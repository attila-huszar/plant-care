<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useDark, useLocalStorage } from '@vueuse/core'
  import { useRouter } from 'vue-router'
  import { useElfsightVoice } from '@/composables'
  import type { SchedulePayload } from '@/types'
  import { useAuthStore, useUserStore } from '../../auth/stores'
  import {
    DashboardHeader,
    EventTimeline,
    PlantList,
    PlantModal,
    SettingsModal,
  } from '../components'
  import { usePlantsStore } from '../stores'

  const authStore = useAuthStore()
  const userStore = useUserStore()
  const router = useRouter()
  const plantsStore = usePlantsStore()
  const isDark = useDark()
  useElfsightVoice()

  const userLabel = computed(() => {
    return userStore.profile?.firstName ?? userStore.profile?.email ?? ''
  })

  const isPlantModalOpen = ref(false)
  const plantModalPlantId = ref<number | null>(null)
  const isSettingsOpen = ref(false)
  const showHistoryCard = useLocalStorage('plant-care-show-history-card', true)

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

  const openSettings = () => {
    isSettingsOpen.value = true
  }

  const closeSettings = () => {
    isSettingsOpen.value = false
  }

  const removePlant = async (payload: { plantId: number }) => {
    if (isPlantModalOpen.value && plantModalPlantId.value === payload.plantId) {
      closePlantModal()
    }
    await plantsStore.removePlant(payload.plantId)
  }

  onMounted(() => {
    void Promise.all([plantsStore.getPlants(), userStore.bootstrap()])
  })

  const handleEvent = async (payload: SchedulePayload) => {
    const event = await plantsStore.addEvent({
      plantId: payload.plantId,
      actionId: payload.actionId,
      ...(payload.notes ? { notes: payload.notes } : {}),
      date: new Date().toISOString(),
    })

    if (!event) return

    if (payload.type === 'date') {
      await plantsStore.removeSchedule(payload.plantId, payload.scheduleId)
    }
  }
</script>

<template>
  <div
    class="flex min-h-screen flex-1 flex-col bg-slate-50/50 dark:bg-slate-950"
  >
    <DashboardHeader
      v-model:is-dark="isDark"
      :user-label="userLabel"
      @settings="openSettings"
      @logout="handleLogout"
    />

    <main
      class="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-8 p-6 lg:grid-cols-3 lg:p-10"
    >
      <div class="lg:col-span-2">
        <PlantList
          :plants="plantsStore.plants"
          :events="plantsStore.events"
          :custom-events="userStore.customEvents"
          @add-plant="openAddPlantModal"
          @edit-plant="openEditPlantModal"
          @remove-plant="removePlant"
        />
      </div>
      <div class="h-full min-h-100">
        <EventTimeline
          :plants="plantsStore.plants"
          :events="plantsStore.events"
          :custom-events="userStore.customEvents"
          :show-history-card="showHistoryCard"
          @event="handleEvent"
        />
      </div>
    </main>

    <PlantModal
      :is-open="isPlantModalOpen"
      :plant-id="plantModalPlantId"
      @close="closePlantModal"
    />
    <SettingsModal
      :is-open="isSettingsOpen"
      v-model:show-history-card="showHistoryCard"
      @close="closeSettings"
    />

    <div
      class="elfsight-app-bc426b86-ebaa-40ef-9518-c05b2bf1cb57"
      data-elfsight-app-lazy
    ></div>
  </div>
</template>
