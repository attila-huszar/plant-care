<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { scheduleActionsMeta } from '@/constants'
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
  import { safeValidate, uuidSchema } from '@plant-care/shared'
  import type { Event, Schedule, ScheduleActionId } from '@plant-care/shared'
  import { useUserStore } from '@/features/auth/stores'
  import {
    buildCustomEventsMap,
    formatRelativeDay,
    getEventIcon,
    getEventLabel,
  } from '@/features/diary/utils'
  import { toDateInputValue, toIsoFromDateInput } from '@/utils'
  import { EditIcon } from '@/assets/svg'
  import { usePlantsStore } from '../stores'
  import SchedulesEditor from './SchedulesEditor.vue'

  const props = defineProps<{
    isOpen: boolean
    plantId: number | null
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const plantsStore = usePlantsStore()
  const userStore = useUserStore()

  const stablePlantId = ref<number | null>(null)
  const stableIsAdd = ref(false)
  const draftName = ref('')
  const isNameEditing = ref(false)
  const originalName = ref('')
  const plantNameInput = ref<HTMLInputElement | null>(null)
  const selectedTabIndex = ref(0)
  const saveError = ref<string | null>(null)

  const plant = computed(() => {
    const plantId = stablePlantId.value
    if (!plantId) return null
    return plantsStore.plants.find((p) => p.id === plantId) ?? null
  })

  const isAddMode = computed(() => stableIsAdd.value)

  const builtinActionIds = new Set<string>(scheduleActionsMeta.map((a) => a.id))

  const actionOptions = computed(() => {
    const options: { id: string; label: string }[] = []

    for (const a of scheduleActionsMeta) {
      options.push({ id: a.id, label: a.label })
    }

    for (const a of userStore.customEvents) {
      options.push({ id: a.id, label: a.name })
    }

    if (plant.value) {
      for (const schedule of plant.value.schedules) {
        const exists = options.some((o) => o.id === schedule.actionId)
        if (!exists) {
          options.push({ id: schedule.actionId, label: schedule.actionId })
        }
      }
    }

    return options
  })

  const customActionNameById = computed(() => {
    return buildCustomEventsMap(userStore.customEvents)
  })

  const sortedHistory = computed<Event[]>(() => {
    if (!plant.value) return []
    return [...plant.value.history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  })

  const latestNotesByActionId = computed(() => {
    const map = new Map<string, string>()

    for (const event of sortedHistory.value) {
      const notes = event.notes?.trim()
      if (!notes) continue
      if (!map.has(event.actionId)) map.set(event.actionId, notes)
    }

    return map
  })

  type DraftScheduleRow = {
    id: string
    type: 'recurring' | 'date'
    actionId: ScheduleActionId
    days: string
    date: string
    notes: string
  }

  const scheduleRows = ref<DraftScheduleRow[]>([])

  const toDays = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
  }

  const initializeRows = () => {
    if (!plant.value) {
      scheduleRows.value = []
      return
    }

    scheduleRows.value = plant.value.schedules.map((schedule) => ({
      id: schedule.id,
      type: schedule.type,
      actionId: schedule.actionId,
      days: schedule.type === 'recurring' ? String(schedule.days) : '7',
      date:
        schedule.type === 'date'
          ? toDateInputValue(new Date(schedule.date))
          : '',
      notes:
        schedule.notes ??
        latestNotesByActionId.value.get(schedule.actionId) ??
        '',
    }))
  }

  watch(
    () => props.isOpen,
    (isOpen) => {
      if (!isOpen) return
      selectedTabIndex.value = 0
      stablePlantId.value = props.plantId
      stableIsAdd.value = props.plantId === null

      if (props.plantId === null) {
        draftName.value = ''
        originalName.value = ''
        isNameEditing.value = false
      } else if (plant.value) {
        originalName.value = plant.value.name
        draftName.value = plant.value.name
        isNameEditing.value = false
      }

      initializeRows()
    },
  )

  watch(
    () => props.plantId,
    (plantId) => {
      if (!props.isOpen) return
      selectedTabIndex.value = 0
      stablePlantId.value = plantId
      stableIsAdd.value = plantId === null
      isNameEditing.value = false
      initializeRows()
    },
  )

  watch(
    plant,
    (p) => {
      if (!props.isOpen) return
      if (isAddMode.value) return
      if (!p) return
      if (isNameEditing.value) return
      originalName.value = p.name
      draftName.value = p.name
    },
    { immediate: true },
  )

  const toggleNameEdit = async () => {
    if (isAddMode.value) return
    if (!plant.value) return

    if (isNameEditing.value) {
      draftName.value = originalName.value
      isNameEditing.value = false
      return
    }

    originalName.value = plant.value.name
    draftName.value = plant.value.name
    isNameEditing.value = true

    await nextTick()
    plantNameInput.value?.focus()
    plantNameInput.value?.select()
  }

  const addScheduleRow = () => {
    scheduleRows.value.push({
      id: crypto.randomUUID(),
      type: 'recurring',
      actionId: 'water',
      days: '7',
      date: '',
      notes: '',
    })
  }

  const removeScheduleRow = (id: string) => {
    scheduleRows.value = scheduleRows.value.filter((r) => r.id !== id)
  }

  const ensureDateDefault = (row: DraftScheduleRow) => {
    if (row.type !== 'date') return
    if (row.date) return
    row.date = toDateInputValue(new Date())
  }

  const setRowType = (
    row: DraftScheduleRow,
    type: DraftScheduleRow['type'],
  ) => {
    row.type = type
    ensureDateDefault(row)
  }

  const save = async () => {
    saveError.value = null

    scheduleRows.value = scheduleRows.value.map((row) => ({
      ...row,
      actionId: row.actionId.trim(),
    }))

    const customActionIds = new Set(userStore.customEvents.map((t) => t.id))
    const idByLabelLower = new Map<string, string>()
    for (const opt of actionOptions.value) {
      idByLabelLower.set(opt.label.toLowerCase(), opt.id)
    }

    const resolvedActionIdByInput = new Map<string, string>()

    const resolvedRows: DraftScheduleRow[] = []
    for (const row of scheduleRows.value) {
      if (!row.actionId) {
        resolvedRows.push(row)
        continue
      }

      const input = row.actionId
      const cached = resolvedActionIdByInput.get(input)
      if (cached) {
        resolvedRows.push({ ...row, actionId: cached })
        continue
      }

      const normalized = idByLabelLower.get(input.toLowerCase()) ?? input

      if (builtinActionIds.has(normalized) || customActionIds.has(normalized)) {
        resolvedActionIdByInput.set(input, normalized)
        resolvedRows.push({ ...row, actionId: normalized })
        continue
      }

      if (safeValidate(uuidSchema, normalized)) {
        saveError.value =
          'One reminder uses a custom care action that no longer exists. Please pick an existing one or create a new one.'
        return
      }

      if (normalized.length > 60) {
        saveError.value = 'Care action names must be 60 characters or less.'
        return
      }

      const created = await userStore.createCustomEvent(normalized)
      if (!created.ok) {
        saveError.value = created.error
        return
      }

      resolvedActionIdByInput.set(input, created.data.id)
      resolvedRows.push({ ...row, actionId: created.data.id })
    }

    scheduleRows.value = resolvedRows

    const lastCadenceIndexByActionId = new Map<string, number>()
    for (let i = 0; i < scheduleRows.value.length; i += 1) {
      const row = scheduleRows.value[i]
      if (row.type !== 'recurring') continue
      if (!row.actionId) continue
      lastCadenceIndexByActionId.set(row.actionId, i)
    }

    const schedules: Schedule[] = []

    for (let i = 0; i < scheduleRows.value.length; i += 1) {
      const row = scheduleRows.value[i]
      if (!row.actionId) continue
      const notes = row.notes.trim()

      if (row.type === 'recurring') {
        const lastIndex = lastCadenceIndexByActionId.get(row.actionId)
        if (lastIndex !== i) continue

        const days = toDays(row.days)
        if (!days) continue

        schedules.push({
          type: 'recurring',
          id: row.id,
          actionId: row.actionId,
          days,
          notes,
        })
        continue
      }

      const iso = toIsoFromDateInput(row.date)
      if (!iso) continue

      schedules.push({
        type: 'date',
        id: row.id,
        actionId: row.actionId,
        date: iso,
        notes,
      })
    }

    if (isAddMode.value) {
      const name = draftName.value.trim()
      if (!name) return

      const result = await plantsStore.addPlant({
        name,
        schedules,
      })
      if (result) emit('close')
      return
    }

    if (!plant.value) return

    const nextName = draftName.value.trim()
    const result = await plantsStore.updatePlant(plant.value.id, {
      ...(nextName && nextName !== plant.value.name ? { name: nextName } : {}),
      schedules,
    })
    if (result) emit('close')
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

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 sm:p-6">
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
              class="w-full max-w-3xl transform-gpu overflow-visible rounded-3xl border border-white/20 bg-white shadow-2xl will-change-transform dark:border-slate-800 dark:bg-slate-900"
            >
              <div class="p-4 sm:p-8">
                <div class="mb-6 flex items-center justify-between">
                  <div>
                    <DialogTitle
                      class="text-2xl font-bold text-slate-800 dark:text-slate-100"
                    >
                      <div class="flex items-center gap-3">
                        <template v-if="isAddMode">Add Plant</template>
                        <template v-else-if="plant">
                          <template v-if="isNameEditing">
                            <input
                              ref="plantNameInput"
                              v-model="draftName"
                              type="text"
                              maxlength="60"
                              class="w-64 max-w-[70vw] rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                            />
                          </template>
                          <template v-else>
                            <span class="truncate">{{ plant.name }}</span>
                          </template>

                          <button
                            type="button"
                            class="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-95 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            @click="toggleNameEdit"
                            :title="
                              isNameEditing
                                ? 'Cancel name edit'
                                : 'Edit plant name'
                            "
                            :aria-label="
                              isNameEditing
                                ? 'Cancel name edit'
                                : 'Edit plant name'
                            "
                          >
                            <span
                              v-if="isNameEditing"
                              class="text-sm"
                              aria-hidden="true"
                            >
                              ✕
                            </span>
                            <EditIcon
                              v-else
                              class="size-4"
                              aria-hidden="true"
                            />
                          </button>
                        </template>
                        <template v-else>Edit Plant</template>
                      </div>
                    </DialogTitle>
                    <p
                      v-if="isAddMode"
                      class="mt-1 text-sm text-slate-500 dark:text-slate-400"
                    >
                      Set up your plant and add care reminders if you want.
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="handleClose"
                    class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close modal"
                    title="Close"
                  >
                    ✕
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

                <form
                  v-else-if="isAddMode"
                  @submit.prevent="save"
                  class="space-y-5"
                >
                  <div class="space-y-4">
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
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:bg-slate-950/60"
                      />
                    </div>
                  </div>

                  <SchedulesEditor
                    :schedule-rows="scheduleRows"
                    :action-options="actionOptions"
                    :add-schedule-row="addScheduleRow"
                    :remove-schedule-row="removeScheduleRow"
                    :set-row-type="setRowType"
                  />

                  <div class="flex flex-col gap-3 pt-2 sm:flex-row">
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

                <TabGroup
                  v-else
                  :selected-index="selectedTabIndex"
                  @change="selectedTabIndex = $event"
                  as="div"
                  class="space-y-5"
                >
                  <TabList
                    class="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800"
                  >
                    <Tab v-slot="{ selected }" as="template">
                      <button
                        type="button"
                        class="-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        :class="
                          selected
                            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                            : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        "
                      >
                        Care plan
                      </button>
                    </Tab>

                    <Tab v-slot="{ selected }" as="template">
                      <button
                        type="button"
                        class="-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        :class="
                          selected
                            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                            : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        "
                      >
                        History
                      </button>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel class="focus:outline-none">
                      <form @submit.prevent="save" class="space-y-5">
                        <SchedulesEditor
                          :schedule-rows="scheduleRows"
                          :action-options="actionOptions"
                          :add-schedule-row="addScheduleRow"
                          :remove-schedule-row="removeScheduleRow"
                          :set-row-type="setRowType"
                        />

                        <div
                          v-if="saveError"
                          class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                        >
                          {{ saveError }}
                        </div>

                        <div class="flex flex-col gap-3 pt-2 sm:flex-row">
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
                            Save
                          </button>
                        </div>
                      </form>
                    </TabPanel>

                    <TabPanel class="focus:outline-none">
                      <div class="space-y-4">
                        <div
                          v-if="sortedHistory.length === 0"
                          class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/30 dark:text-slate-300"
                        >
                          No care entries yet.
                        </div>

                        <div
                          v-else
                          class="max-h-[55vh] space-y-3 overflow-y-auto pr-1"
                        >
                          <div
                            v-for="event in sortedHistory"
                            :key="event.id"
                            class="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30"
                          >
                            <div
                              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                            >
                              {{ getEventIcon(event.actionId) }}
                            </div>

                            <div class="min-w-0 flex-1">
                              <div
                                class="flex items-start justify-between gap-3"
                              >
                                <p
                                  class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                                >
                                  {{
                                    getEventLabel(
                                      event.actionId,
                                      customActionNameById,
                                    )
                                  }}
                                </p>
                                <p
                                  class="shrink-0 text-xs text-slate-400 dark:text-slate-500"
                                >
                                  {{ formatRelativeDay(event.date) }}
                                </p>
                              </div>

                              <p
                                v-if="event.notes"
                                class="mt-1 text-sm text-slate-600 dark:text-slate-300"
                              >
                                {{ event.notes }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="flex pt-2">
                          <button
                            type="button"
                            @click="handleClose"
                            class="ml-auto rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </TabPanel>
                  </TabPanels>
                </TabGroup>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
