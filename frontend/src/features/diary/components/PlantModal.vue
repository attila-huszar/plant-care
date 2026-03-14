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
            class="w-full max-w-3xl transform-gpu overflow-visible rounded-3xl border border-white/20 bg-white shadow-2xl will-change-transform dark:border-slate-800 dark:bg-slate-900"
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
                    class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    <template v-if="!isNameEditing">
                      <span
                        class="font-medium text-slate-700 dark:text-slate-200"
                      >
                        {{ plant.name }}
                      </span>
                    </template>
                    <template v-else>
                      <input
                        ref="plantNameInput"
                        v-model="draftName"
                        type="text"
                        maxlength="60"
                        class="w-56 max-w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                      />
                    </template>

                    <button
                      type="button"
                      class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      @click="toggleNameEdit"
                    >
                      {{ isNameEditing ? 'Cancel' : 'Edit' }}
                    </button>
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
                      class="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                      <div class="w-32 shrink-0">
                        <label
                          class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                        >
                          Kind
                        </label>
                        <div class="relative">
                          <select
                            v-model="row.kind"
                            @change="ensureDateDefault(row)"
                            class="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                          >
                            <option value="recurring">Recurring</option>
                            <option value="date">Date</option>
                          </select>
                          <span
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
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
                      </div>

                      <div class="flex min-w-0 flex-1 items-end gap-3">
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
                          class="w-24 shrink-0"
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
                        class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
                        @click="removeRuleRow(row.key)"
                        aria-label="Remove action"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="addRuleRow"
                    class="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
                  >
                    <span aria-hidden="true">+</span>
                    Add New
                  </button>
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
