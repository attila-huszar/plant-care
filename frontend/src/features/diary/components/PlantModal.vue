<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { PLANT_CARE_META } from '@/constants'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Tab,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import { toDateInputValue, toIsoFromDateInput } from '@/utils'
  import type { EventType, OccurrenceRequirement, ScheduledCare } from '@/types'
  import { useDiaryStore } from '../stores/diary'
  import ActionTypeListbox from './ActionTypeListbox.vue'

  const props = defineProps<{
    isOpen: boolean
    plantId: string | null
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const diaryStore = useDiaryStore()

  const stablePlantId = ref<string | null>(null)
  const stableIsAdd = ref(false)
  const draftName = ref('')
  const draftSpecies = ref('')

  const plant = computed(() => {
    const plantId = stablePlantId.value
    if (!plantId) return null
    return diaryStore.plants.find((p) => p.id === plantId) ?? null
  })

  const isAddMode = computed(() => stableIsAdd.value)

  const typeOptions = computed(() => {
    const options: { id: EventType; label: string }[] = []

    for (const t of PLANT_CARE_META) {
      options.push({ id: t.id, label: t.label })
    }

    for (const t of diaryStore.customEventTypes) {
      options.push({ id: t.id, label: t.name })
    }

    for (const occurrence of plant.value?.occurrences ?? []) {
      const exists = options.some((o) => o.id === occurrence.typeId)
      if (!exists) {
        options.push({ id: occurrence.typeId, label: occurrence.typeId })
      }
    }

    for (const scheduled of plant.value?.scheduledCare ?? []) {
      const exists = options.some((o) => o.id === scheduled.typeId)
      if (!exists) {
        options.push({ id: scheduled.typeId, label: scheduled.typeId })
      }
    }

    return options
  })

  type DraftRow = {
    key: string
    typeId: EventType
    days: string
  }

  type ScheduledDraftRow = {
    key: string
    id: string
    typeId: EventType
    date: string
  }

  const rows = ref<DraftRow[]>([])
  const scheduledRows = ref<ScheduledDraftRow[]>([])
  const newCustomName = ref('')
  const careTabIndex = ref(0)

  const toDays = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
  }

  const initializeRows = () => {
    if (!plant.value) {
      rows.value = []
      scheduledRows.value = []
      return
    }

    rows.value = (plant.value.occurrences ?? []).map((o) => ({
      key: crypto.randomUUID(),
      typeId: o.typeId,
      days: String(o.days),
    }))

    scheduledRows.value = (plant.value.scheduledCare ?? []).map((i) => ({
      key: crypto.randomUUID(),
      id: i.id,
      typeId: i.typeId,
      date: toDateInputValue(new Date(i.date)),
    }))
  }

  watch(
    () => props.isOpen,
    (isOpen) => {
      if (!isOpen) return
      stablePlantId.value = props.plantId
      stableIsAdd.value = props.plantId === null
      careTabIndex.value = 0

      if (props.plantId === null) {
        draftName.value = ''
        draftSpecies.value = ''
      }

      initializeRows()
      newCustomName.value = ''
    },
  )

  watch(
    () => props.plantId,
    (plantId) => {
      if (!props.isOpen) return
      stablePlantId.value = plantId
      stableIsAdd.value = plantId === null
      initializeRows()
    },
  )

  const addRow = () => {
    rows.value.push({
      key: crypto.randomUUID(),
      typeId: 'water',
      days: '7',
    })
  }

  const addScheduledRow = () => {
    scheduledRows.value.push({
      key: crypto.randomUUID(),
      id: crypto.randomUUID(),
      typeId: 'water',
      date: '',
    })
  }

  const removeRow = (key: string) => {
    rows.value = rows.value.filter((r) => r.key !== key)
  }

  const removeScheduledRow = (key: string) => {
    scheduledRows.value = scheduledRows.value.filter((r) => r.key !== key)
  }

  const addCustomType = () => {
    const name = newCustomName.value.trim()
    if (!name) return
    diaryStore.addCustomEventType(name)
    newCustomName.value = ''
  }

  const save = () => {
    const seen = new Set<string>()
    const occurrences: OccurrenceRequirement[] = []

    for (let i = rows.value.length - 1; i >= 0; i -= 1) {
      const row = rows.value[i]
      const days = toDays(row.days)
      if (!days) continue
      if (!row.typeId) continue
      if (seen.has(row.typeId)) continue
      seen.add(row.typeId)
      occurrences.unshift({ typeId: row.typeId, days })
    }

    const scheduledCare: ScheduledCare[] = []

    for (const row of scheduledRows.value) {
      if (!row.typeId) continue
      const iso = toIsoFromDateInput(row.date)
      if (!iso) continue
      scheduledCare.push({ id: row.id, typeId: row.typeId, date: iso })
    }

    if (isAddMode.value) {
      const name = draftName.value.trim()
      if (!name) return

      diaryStore.addPlant({
        name,
        species: draftSpecies.value.trim() || 'Unknown',
        dateAdded: new Date().toISOString(),
        occurrences,
        scheduledCare,
      })
      emit('close')
      return
    }

    if (!plant.value) return

    diaryStore.updatePlantOccurrences(plant.value.id, occurrences)
    diaryStore.updatePlantScheduledCare(plant.value.id, scheduledCare)
    emit('close')
  }

  const handleClose = () => {
    emit('close')
  }
</script>

<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0 scale-85"
          enter-to="opacity-100 scale-100"
          leave="ease-in duration-150"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogPanel
            class="w-full max-w-lg transform-gpu overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl will-change-transform dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="px-6 py-6 sm:p-8">
              <div class="mb-6 flex items-center justify-between">
                <div>
                  <DialogTitle
                    class="text-2xl font-bold text-slate-800 dark:text-slate-100"
                  >
                    {{ isAddMode ? 'Add plant' : 'Edit plant' }}
                  </DialogTitle>
                  <p
                    v-if="!isAddMode && plant"
                    class="mt-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    {{ plant.name }} • {{ plant.species }}
                  </p>
                  <p
                    v-else-if="isAddMode"
                    class="mt-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    Set up your plant and optionally add care reminders.
                  </p>
                </div>
                <button
                  type="button"
                  @click="handleClose"
                  class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div
                v-if="!isAddMode && !plant"
                class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  No plant selected.
                </p>
              </div>

              <form v-else @submit.prevent="save" class="space-y-5">
                <div v-if="isAddMode" class="space-y-4">
                  <div>
                    <label
                      for="plantName"
                      class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                      >Plant name <span class="text-rose-500">*</span></label
                    >
                    <input
                      id="plantName"
                      v-model="draftName"
                      type="text"
                      required
                      placeholder="e.g. Barnaby"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      for="plantSpecies"
                      class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                      >Species / Variety</label
                    >
                    <input
                      id="plantSpecies"
                      v-model="draftSpecies"
                      type="text"
                      placeholder="e.g. Monstera Deliciosa"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4
                      class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Care actions
                    </h4>
                    <button
                      type="button"
                      @click="careTabIndex === 0 ? addRow() : addScheduledRow()"
                      class="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      + Add action
                    </button>
                  </div>

                  <TabGroup
                    as="div"
                    :selectedIndex="careTabIndex"
                    @change="(idx) => (careTabIndex = idx)"
                  >
                    <TabList
                      class="flex gap-2 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-950/40"
                    >
                      <Tab v-slot="{ selected }" as="template">
                        <button
                          type="button"
                          class="flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                          :class="
                            selected
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'
                          "
                        >
                          Recurring
                        </button>
                      </Tab>
                      <Tab v-slot="{ selected }" as="template">
                        <button
                          type="button"
                          class="flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                          :class="
                            selected
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'
                          "
                        >
                          Date
                        </button>
                      </Tab>
                    </TabList>

                    <TabPanels class="mt-3">
                      <TabPanel>
                        <div
                          v-if="rows.length === 0"
                          class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30"
                        >
                          <p class="text-sm text-slate-600 dark:text-slate-300">
                            No occurrence schedule yet. Add an action to start.
                          </p>
                        </div>

                        <div v-else class="space-y-3">
                          <div
                            v-for="row in rows"
                            :key="row.key"
                            class="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                          >
                            <div class="min-w-0 flex-1">
                              <ActionTypeListbox
                                v-model="row.typeId"
                                :options="typeOptions"
                                label="Action"
                              />
                            </div>

                            <div class="w-32">
                              <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                              >
                                Every (days)
                              </label>
                              <input
                                v-model="row.days"
                                type="number"
                                min="1"
                                inputmode="numeric"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                              />
                            </div>

                            <button
                              type="button"
                              class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
                              @click="removeRow(row.key)"
                              aria-label="Remove action"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </TabPanel>

                      <TabPanel>
                        <div
                          v-if="scheduledRows.length === 0"
                          class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30"
                        >
                          <p class="text-sm text-slate-600 dark:text-slate-300">
                            No one-off dates yet. Add an action to start.
                          </p>
                        </div>

                        <div v-else class="space-y-3">
                          <div
                            v-for="row in scheduledRows"
                            :key="row.key"
                            class="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                          >
                            <div class="min-w-0 flex-1">
                              <ActionTypeListbox
                                v-model="row.typeId"
                                :options="typeOptions"
                                label="Action"
                              />
                            </div>

                            <div class="w-44">
                              <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                              >
                                Date
                              </label>
                              <input
                                v-model="row.date"
                                type="date"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                              />
                            </div>

                            <button
                              type="button"
                              class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
                              @click="removeScheduledRow(row.key)"
                              aria-label="Remove action"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </TabGroup>
                </div>

                <div
                  class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <h4
                    class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Custom events
                  </h4>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add your own action types (e.g. “Mist”, “Prune”).
                  </p>

                  <div class="mt-3 flex gap-3">
                    <input
                      v-model="newCustomName"
                      type="text"
                      placeholder="New custom action"
                      class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:bg-slate-950/60"
                    />
                    <button
                      type="button"
                      @click="addCustomType"
                      class="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    @click="handleClose"
                    class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
                  >
                    {{ isAddMode ? 'Add Plant' : 'Save' }}
                  </button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
