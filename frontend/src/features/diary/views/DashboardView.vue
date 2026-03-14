<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useDark } from '@vueuse/core'
  import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    Switch,
  } from '@headlessui/vue'
  import { useRouter } from 'vue-router'
  import type { CareTimelinePayload } from '@/types'
  import { MoonIcon, PlantIcon, SunIcon } from '@/assets/svg'
  import { useAuthStore, useUserStore } from '../../auth/stores'
  import {
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

  const isPlantModalOpen = ref(false)
  const plantModalPlantId = ref<number | null>(null)
  const isSettingsOpen = ref(false)

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

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  onMounted(() => {
    void Promise.all([plantsStore.loadPlants(), userStore.bootstrap()])
  })

  const handleCare = async (payload: CareTimelinePayload) => {
    const event = await plantsStore.addEvent({
      plantId: payload.plantId,
      type: payload.type,
      notes: '',
      date: new Date().toISOString(),
    })

    if (!event) return

    if (payload.kind === 'date') {
      await plantsStore.removeCareRuleItem(payload.plantId, payload.careRuleId)
    }
  }
</script>

<template>
  <div
    class="flex min-h-screen flex-1 flex-col bg-slate-50/50 dark:bg-slate-950"
  >
    <!-- Navbar -->
    <header
      class="sticky top-0 z-30 flex h-15 items-center justify-between gap-4 border-b border-emerald-100 bg-white/85 px-6 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/85"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <span
          class="inline-flex h-10 w-10 shrink-0 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_20px_currentColor)]"
        >
          <img :src="PlantIcon" alt="" aria-hidden="true" class="h-10 w-10" />
        </span>
        <h1
          class="line-clamp-2 min-w-0 text-xl leading-tight font-bold text-emerald-900 dark:text-slate-100"
        >
          Plant Care Diary
        </h1>
      </div>

      <div class="flex shrink-0 items-center gap-3 min-[480px]:gap-4">
        <Switch
          v-model="isDark"
          class="relative hidden h-8 w-14 items-center rounded-full transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none min-[480px]:inline-flex dark:focus:ring-offset-slate-950"
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

        <Menu as="div" class="relative inline-block text-left">
          <MenuButton
            class="inline-flex max-w-64 items-center gap-2 truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold whitespace-nowrap text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
          >
            <span class="min-w-0 truncate">
              Hello,
              {{ userStore.profile?.firstName ?? userStore.profile?.email }}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-4 w-4 shrink-0 text-slate-400"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06"
                clip-rule="evenodd"
              />
            </svg>
          </MenuButton>

          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems
              class="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-xl border border-white/60 bg-white/95 p-1 shadow-xl ring-1 ring-black/10 focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/95 dark:ring-white/10"
            >
              <div class="space-y-1">
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="openSettings"
                    class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium"
                    :class="
                      active
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200'
                    "
                  >
                    ⚙ Settings
                  </button>
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="toggleTheme"
                    class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium min-[480px]:hidden"
                    :class="
                      active
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200'
                    "
                  >
                    🌓 Toggle theme
                  </button>
                </MenuItem>

                <div
                  class="mx-auto my-1 h-px w-[95%] bg-slate-200/80 dark:bg-slate-700/70"
                />

                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="handleLogout"
                    class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium"
                    :class="
                      active
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200'
                        : 'text-slate-700 dark:text-slate-200'
                    "
                  >
                    🚪 Log Out
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-8 p-6 lg:grid-cols-3 lg:p-10"
    >
      <div class="lg:col-span-2">
        <PlantList
          :plants="plantsStore.plants"
          :events="plantsStore.events"
          :customEvents="userStore.customEvents"
          @add-plant="openAddPlantModal"
          @edit-plant="openEditPlantModal"
        />
      </div>
      <div class="h-full min-h-100">
        <EventTimeline
          :plants="plantsStore.plants"
          :events="plantsStore.events"
          :customEvents="userStore.customEvents"
          @care="handleCare"
        />
      </div>
    </main>

    <!-- Modals -->
    <PlantModal
      :is-open="isPlantModalOpen"
      :plant-id="plantModalPlantId"
      @close="closePlantModal"
    />
    <SettingsModal :is-open="isSettingsOpen" @close="closeSettings" />
  </div>
</template>
