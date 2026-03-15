<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { PLANT_CARE_META } from '@/constants'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import type { CareRule, EventType } from '@plant-care/shared'
  import { useUserStore } from '@/features/auth/stores'
  import { toDateInputValue, toIsoFromDateInput } from '@/utils'
  import { usePlantsStore } from '../stores'
  import ActionTypeListbox from './ActionTypeListbox.vue'

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

  const plant = computed(() => {
    const plantId = stablePlantId.value
    if (!plantId) return null
    return plantsStore.plants.find((p) => p.id === plantId) ?? null
  })

  const isAddMode = computed(() => stableIsAdd.value)

  const builtinTypeIds = new Set(PLANT_CARE_META.map((t) => t.id))

  const typeOptions = computed(() => {
    const options: { id: EventType; label: string }[] = []

    for (const t of PLANT_CARE_META) {
      options.push({ id: t.id, label: t.label })
    }

    for (const t of userStore.customEvents) {
      options.push({ id: t.id, label: t.name })
    }

    for (const rule of plant.value?.careRules ?? []) {
      const exists = options.some((o) => o.id === rule.type)
      if (!exists) {
        options.push({ id: rule.type, label: rule.type })
      }
    }

    return options
  })

  type DraftCareRuleRow = {
    key: string
    id: string
    kind: 'recurring' | 'date'
    type: EventType
    days: string
    date: string
  }

  const ruleRows = ref<DraftCareRuleRow[]>([])

  const toDays = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
  }

  const initializeRows = () => {
    if (!plant.value) {
      ruleRows.value = []
      return
    }

    ruleRows.value = (plant.value.careRules ?? []).map((r) => ({
      key: crypto.randomUUID(),
      id: r.id,
      kind: r.kind,
      type: r.type,
      days: r.kind === 'recurring' ? String(r.days) : '7',
      date: r.kind === 'date' ? toDateInputValue(new Date(r.date)) : '',
    }))
  }

  watch(
    () => props.isOpen,
    (isOpen) => {
      if (!isOpen) return
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

  const addRuleRow = () => {
    ruleRows.value.push({
      key: crypto.randomUUID(),
      id: crypto.randomUUID(),
      kind: 'recurring',
      type: 'water',
      days: '7',
      date: '',
    })
  }

  const removeRuleRow = (key: string) => {
    ruleRows.value = ruleRows.value.filter((r) => r.key !== key)
  }

  const ensureDateDefault = (row: DraftCareRuleRow) => {
    if (row.kind !== 'date') return
    if (row.date) return
    row.date = toDateInputValue(new Date())
  }

  const save = async () => {
    ruleRows.value = ruleRows.value.map((row) => ({
      ...row,
      type: row.type.trim(),
    }))

    const usedTypes = [
      ...new Set(ruleRows.value.map((row) => row.type).filter(Boolean)),
    ]

    const customTypeIds = new Set(userStore.customEvents.map((t) => t.id))
    const idByLabelLower = new Map<string, EventType>()
    for (const opt of typeOptions.value) {
      idByLabelLower.set(opt.label.toLowerCase(), opt.id)
    }
    const resolvedTypeByInput = new Map<EventType, EventType>()

    for (const inputType of usedTypes) {
      const normalizedType =
        idByLabelLower.get(inputType.toLowerCase()) ?? inputType

      if (
        builtinTypeIds.has(normalizedType) ||
        customTypeIds.has(normalizedType)
      ) {
        resolvedTypeByInput.set(inputType, normalizedType)
        continue
      }

      if (normalizedType.length > 60) return

      const result = await userStore.createCustomEvent(normalizedType)
      if (!result.ok) return

      resolvedTypeByInput.set(inputType, result.data.id)
    }

    ruleRows.value = ruleRows.value.map((row) => ({
      ...row,
      type: resolvedTypeByInput.get(row.type) ?? row.type,
    }))

    const lastCadenceIndexByType = new Map<string, number>()
    for (let i = 0; i < ruleRows.value.length; i += 1) {
      const row = ruleRows.value[i]
      if (row.kind !== 'recurring') continue
      if (!row.type) continue
      lastCadenceIndexByType.set(row.type, i)
    }

    const careRules: CareRule[] = []

    for (let i = 0; i < ruleRows.value.length; i += 1) {
      const row = ruleRows.value[i]
      if (!row.type) continue

      if (row.kind === 'recurring') {
        const lastIndex = lastCadenceIndexByType.get(row.type)
        if (lastIndex !== i) continue

        const days = toDays(row.days)
        if (!days) continue

        careRules.push({
          kind: 'recurring',
          id: row.id,
          type: row.type,
          days,
        })
        continue
      }

      const iso = toIsoFromDateInput(row.date)
      if (!iso) continue

      careRules.push({
        kind: 'date',
        id: row.id,
        type: row.type,
        date: iso,
      })
    }

    if (isAddMode.value) {
      const name = draftName.value.trim()
      if (!name) return

      const result = await plantsStore.addPlant({
        name,
        careRules,
      })
      if (result) emit('close')
      return
    }

    if (!plant.value) return

    const nextName = draftName.value.trim()
    const result = await plantsStore.updatePlant(plant.value.id, {
      ...(nextName && nextName !== plant.value.name ? { name: nextName } : {}),
      careRules,
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
        <div
          class="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6"
        >
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
                            <svg
                              v-else
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 640 640"
                              fill="currentColor"
                              class="size-4"
                              aria-hidden="true"
                            >
                              <path
                                d="M416.9 85.2 372 130.1 509.9 268l44.9-44.9c13.6-13.5 21.2-31.9 21.2-51.1s-7.6-37.6-21.2-51.1l-35.7-35.7C505.6 71.6 487.2 64 468 64s-37.6 7.6-51.1 21.2M338.1 164 122.9 379.1c-10.7 10.7-18.5 24.1-22.6 38.7L64.9 545.6c-2.3 8.3 0 17.3 6.2 23.4s15.1 8.5 23.4 6.2l127.8-35.5c14.6-4.1 27.9-11.8 38.7-22.6l215-215.2z"
                              />
                            </svg>
                          </button>
                        </template>
                        <template v-else>Edit Plant</template>
                      </div>
                    </DialogTitle>
                    <p
                      v-if="isAddMode"
                      class="mt-1 text-sm text-slate-500 dark:text-slate-400"
                    >
                      Set up your plant and optionally add care reminders.
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
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:bg-slate-950/60"
                      />
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div
                      v-if="ruleRows.length === 0"
                      class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30"
                    >
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        No care rules yet. Add a task to start.
                      </p>
                    </div>

                    <div v-else class="space-y-3">
                      <div
                        v-for="row in ruleRows"
                        :key="row.key"
                        class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-end dark:border-slate-800 dark:bg-slate-950/30"
                      >
                        <div class="w-full shrink-0 sm:w-32">
                          <label
                            class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                          >
                            Kind
                          </label>
                          <div class="flex items-end gap-2">
                            <div class="relative min-w-0 flex-1">
                              <select
                                v-model="row.kind"
                                @change="ensureDateDefault(row)"
                                class="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                              >
                                <option value="recurring">Recurring</option>
                                <option value="date">One-off</option>
                              </select>
                              <span
                                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                              >
                                <svg
                                  class="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>

                            <button
                              type="button"
                              class="inline-flex size-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 sm:hidden dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
                              @click="removeRuleRow(row.key)"
                              aria-label="Remove action"
                              title="Remove"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 640 640"
                                fill="currentColor"
                                class="h-4 w-4"
                              >
                                <path
                                  d="M232.7 69.9 224 96h-96c-17.7 0-32 14.3-32 32s14.3 32 32 32h384c17.7 0 32-14.3 32-32s-14.3-32-32-32h-96l-8.7-26.1C402.9 56.8 390.7 48 376.9 48H263.1c-13.8 0-26 8.8-30.4 21.9M512 208H128l21.1 323.1c1.6 25.3 22.6 44.9 47.9 44.9h246c25.3 0 46.3-19.6 47.9-44.9z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div
                          class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end"
                        >
                          <div
                            class="min-w-0"
                            :class="row.kind === 'date' ? 'flex-3' : 'flex-1'"
                          >
                            <ActionTypeListbox
                              v-model="row.type"
                              :options="typeOptions"
                              label="Task"
                            />
                          </div>

                          <div
                            v-if="row.kind === 'recurring'"
                            class="w-full shrink-0 sm:w-24"
                          >
                            <label
                              class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                            >
                              Days
                            </label>
                            <input
                              v-model="row.days"
                              type="number"
                              min="1"
                              inputmode="numeric"
                              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                            />
                          </div>

                          <div v-else class="min-w-0 flex-2">
                            <label
                              class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                            >
                              Date
                            </label>
                            <input
                              v-model="row.date"
                              type="date"
                              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          class="hidden size-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 sm:inline-flex dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
                          @click="removeRuleRow(row.key)"
                          aria-label="Remove action"
                          title="Remove"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 640 640"
                            fill="currentColor"
                            class="h-4 w-4"
                          >
                            <path
                              d="M232.7 69.9 224 96h-96c-17.7 0-32 14.3-32 32s14.3 32 32 32h384c17.7 0 32-14.3 32-32s-14.3-32-32-32h-96l-8.7-26.1C402.9 56.8 390.7 48 376.9 48H263.1c-13.8 0-26 8.8-30.4 21.9M512 208H128l21.1 323.1c1.6 25.3 22.6 44.9 47.9 44.9h246c25.3 0 46.3-19.6 47.9-44.9z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      @click="addRuleRow"
                      class="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
                    >
                      <span aria-hidden="true">+</span>
                      Add new task
                    </button>
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
                      {{ isAddMode ? 'Add Plant' : 'Save' }}
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
