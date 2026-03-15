<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { DEFAULT_TASK_ICON, PLANT_CARE_META } from '@/constants'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import type {
    CustomEventDto,
    EventDto,
    EventType,
    PlantDto,
  } from '@plant-care/shared'
  import type { CareTimelinePayload, UpcomingItem } from '@/types'
  import { CalendarIcon, CheckIcon } from '@/assets/svg'

  const BUILTIN_ACTION_META_BY_ID = new Map(
    PLANT_CARE_META.map((t) => [t.id, t]),
  )

  const props = defineProps<{
    plants: PlantDto[]
    events: EventDto[]
    customEvents?: CustomEventDto[]
  }>()

  const emit = defineEmits<{
    care: [payload: CareTimelinePayload]
  }>()

  const DAY_MS = 1000 * 60 * 60 * 24
  const startOfDayMs = (ms: number) => {
    const date = new Date(ms)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }

  const customTypeNameById = computed(() => {
    const map = new Map<string, string>()
    for (const t of props.customEvents ?? []) {
      map.set(t.id, t.name)
    }
    return map
  })

  const latestEventMsByPlantAndType = computed(() => {
    const map = new Map<string, number>()
    for (const event of props.events) {
      const ms = new Date(event.date).getTime()
      if (!Number.isFinite(ms)) continue
      const key = `${event.plantId}:${event.type}`
      const prev = map.get(key)
      if (prev === undefined || ms > prev) map.set(key, ms)
    }
    return map
  })

  const getTypeIcon = (typeId: EventType) => {
    return BUILTIN_ACTION_META_BY_ID.get(typeId)?.icon ?? DEFAULT_TASK_ICON
  }

  const getTypeLabel = (typeId: EventType) => {
    const builtinLabel = BUILTIN_ACTION_META_BY_ID.get(typeId)?.label
    if (builtinLabel) return builtinLabel
    return customTypeNameById.value.get(typeId) ?? typeId
  }

  const upcomingCareAll = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    const items: UpcomingItem[] = []

    for (const plant of props.plants) {
      for (const rule of plant.careRules ?? []) {
        if (!rule) continue

        if (rule.kind === 'recurring') {
          if (rule.days <= 0) continue

          const key = `${plant.id}:${rule.id}`
          const lastEventKey = `${plant.id}:${rule.type}`
          const lastEventMs =
            latestEventMsByPlantAndType.value.get(lastEventKey)
          const baseMs = startOfDayMs(lastEventMs ?? todayMs)

          const dueDayMs = baseMs + rule.days * DAY_MS
          const dueDate = new Date(dueDayMs)
          const diffDays = Math.round((dueDayMs - todayMs) / DAY_MS)

          items.push({
            key: String(key),
            plantId: plant.id,
            plantName: plant.name,
            careRuleId: rule.id,
            type: rule.type,
            dueDate,
            diffDays,
            kind: 'recurring',
            days: rule.days,
          })
          continue
        }

        const dueMs = new Date(rule.date).getTime()
        if (!Number.isFinite(dueMs)) continue

        const dueDayMs = startOfDayMs(dueMs)
        const dueDate = new Date(dueDayMs)
        const diffDays = Math.round((dueDayMs - todayMs) / DAY_MS)

        items.push({
          key: String(`${plant.id}:${rule.id}`),
          plantId: plant.id,
          plantName: plant.name,
          careRuleId: rule.id,
          type: rule.type,
          dueDate,
          diffDays,
          kind: 'date',
        })
      }
    }

    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  })

  const upcomingCare = computed(() => {
    return upcomingCareAll.value.slice(0, 6)
  })

  const highlightedKey = computed(() => {
    let best: (typeof upcomingCare.value)[number] | null = null
    let bestAbs = Number.POSITIVE_INFINITY

    for (const item of upcomingCare.value) {
      const abs = Math.abs(item.diffDays)
      if (abs < bestAbs) {
        bestAbs = abs
        best = item
        continue
      }

      if (abs === bestAbs && best) {
        const a = Math.abs(item.dueDate.getTime() - Date.now())
        const b = Math.abs(best.dueDate.getTime() - Date.now())
        if (a < b) best = item
      }
    }

    return best?.key ?? null
  })

  const formatDueLabel = (diffDays: number) => {
    if (diffDays === 0) return 'Today'
    const abs = Math.abs(diffDays)
    const unit = abs === 1 ? 'day' : 'days'
    if (diffDays > 0) return `In ${abs} ${unit}`
    return `Overdue by ${abs} ${unit}`
  }

  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / DAY_MS),
      'day',
    )
  }

  const enrichedEvents = computed(() => {
    return [...props.events]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => {
        const plant = props.plants.find((p) => p.id === e.plantId)
        return { ...e, plantName: plant?.name || 'Unknown Plant' }
      })
  })

  const HISTORY_PAGE_SIZE = 6
  const historyPage = ref(1)

  const historyTotalPages = computed(() => {
    return Math.max(
      1,
      Math.ceil(enrichedEvents.value.length / HISTORY_PAGE_SIZE),
    )
  })

  const historyPageSafe = computed(() => {
    return Math.min(Math.max(1, historyPage.value), historyTotalPages.value)
  })

  const historySliceStart = computed(() => {
    return (historyPageSafe.value - 1) * HISTORY_PAGE_SIZE
  })

  const pagedHistoryEvents = computed(() => {
    return enrichedEvents.value.slice(
      historySliceStart.value,
      historySliceStart.value + HISTORY_PAGE_SIZE,
    )
  })

  const canHistoryPrev = computed(() => historyPageSafe.value > 1)
  const canHistoryNext = computed(
    () => historyPageSafe.value < historyTotalPages.value,
  )

  const historyPrev = () => {
    if (!canHistoryPrev.value) return
    historyPage.value = historyPageSafe.value - 1
  }

  const historyNext = () => {
    if (!canHistoryNext.value) return
    historyPage.value = historyPageSafe.value + 1
  }

  watch(
    () => enrichedEvents.value.length,
    () => {
      if (historyPage.value > historyTotalPages.value) {
        historyPage.value = historyTotalPages.value
      }
    },
  )

  const completingKeys = ref<Set<string>>(new Set())
  const isCompleteDialogOpen = ref(false)
  const pendingCompleteItem = ref<(typeof upcomingCare.value)[number] | null>(
    null,
  )
  const pendingNotes = ref('')

  const isCompleting = (key: string) => {
    return completingKeys.value.has(key)
  }

  const markCompleting = (key: string) => {
    const next = new Set(completingKeys.value)
    next.add(key)
    completingKeys.value = next
  }

  const unmarkCompleting = (key: string) => {
    const next = new Set(completingKeys.value)
    next.delete(key)
    completingKeys.value = next
  }

  const canCompleteItem = (item: (typeof upcomingCare.value)[number]) => {
    return item.diffDays <= 0
  }

  const closeCompleteDialog = () => {
    isCompleteDialogOpen.value = false
    pendingCompleteItem.value = null
    pendingNotes.value = ''
  }

  const openCompleteDialog = (item: (typeof upcomingCare.value)[number]) => {
    pendingCompleteItem.value = item
    pendingNotes.value = ''
    isCompleteDialogOpen.value = true
  }

  const confirmComplete = () => {
    const item = pendingCompleteItem.value
    if (!item) return
    if (!canCompleteItem(item)) return
    if (isCompleting(item.key)) return

    const notes = pendingNotes.value.trim()
    markCompleting(item.key)

    emit('care', {
      plantId: item.plantId,
      type: item.type,
      kind: item.kind,
      careRuleId: item.careRuleId,
      ...(notes ? { notes } : {}),
    })

    closeCompleteDialog()

    window.setTimeout(() => {
      unmarkCompleting(item.key)
    }, 700)
  }

  const completeItemQuick = (item: (typeof upcomingCare.value)[number]) => {
    if (!canCompleteItem(item)) return
    if (isCompleting(item.key)) return

    markCompleting(item.key)

    emit('care', {
      plantId: item.plantId,
      type: item.type,
      kind: item.kind,
      careRuleId: item.careRuleId,
    })

    window.setTimeout(() => {
      unmarkCompleting(item.key)
    }, 700)
  }
</script>

<template>
  <section class="flex h-full flex-col gap-6">
    <TransitionRoot as="template" :show="isCompleteDialogOpen">
      <Dialog as="div" class="relative z-50" @close="closeCompleteDialog">
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
              enter-from="opacity-0 scale-90"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-150"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-90"
            >
              <DialogPanel
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="p-5 sm:p-6">
                  <DialogTitle
                    class="text-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    Mark as done
                  </DialogTitle>

                  <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Add optional notes for this event.
                  </p>

                  <div class="mt-4">
                    <label
                      class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Notes (optional)
                    </label>
                    <textarea
                      v-model="pendingNotes"
                      rows="3"
                      maxlength="1000"
                      placeholder="e.g. watered thoroughly until runoff"
                      class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition-all hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:bg-slate-950/60"
                    />
                  </div>

                  <div class="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      @click="closeCompleteDialog"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
                      @click="confirmComplete"
                    >
                      Mark as done
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Activity
      </h2>
    </div>

    <div class="grid min-h-0 flex-1 grid-rows-2 gap-4">
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Upcoming care
          </h3>
        </div>

        <div v-if="upcomingCareAll.length === 0" class="px-4 py-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            No upcoming care items. Add a schedule when creating a plant.
          </p>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-2">
          <div
            v-for="item in upcomingCare"
            :key="item.key"
            class="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors"
            :class="
              item.key === highlightedKey
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
            "
          >
            <div class="flex min-w-0 flex-1 items-start gap-3 text-left">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
              >
                {{ getTypeIcon(item.type) }}
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  <span>{{ getTypeLabel(item.type) }}</span>
                  for
                  <span class="font-bold text-emerald-700">{{
                    item.plantName
                  }}</span>
                </p>
                <p
                  class="mt-0.5 text-xs"
                  :class="
                    item.diffDays < 0
                      ? 'text-rose-600'
                      : item.diffDays <= 2
                        ? 'text-amber-600'
                        : 'text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ formatDueLabel(item.diffDays) }} •
                  <span v-if="item.kind === 'recurring'">
                    every {{ item.days }} days
                  </span>
                  <span v-else>one-off</span>
                </p>
              </div>
            </div>

            <button
              v-if="canCompleteItem(item)"
              type="button"
              class="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              @click.stop="openCompleteDialog(item)"
              :disabled="isCompleting(item.key)"
              aria-label="Add notes"
              title="Add notes"
            >
              <span aria-hidden="true">⋯</span>
            </button>

            <button
              v-if="canCompleteItem(item)"
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                isCompleting(item.key)
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/60 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800'
              "
              @click.stop="completeItemQuick(item)"
              :disabled="isCompleting(item.key)"
              aria-label="Mark as done"
              title="Mark as done"
            >
              <CheckIcon class="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div class="flex items-center justify-between gap-3">
            <h3
              class="text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              History
            </h3>

            <div
              v-if="enrichedEvents.length > HISTORY_PAGE_SIZE"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ historyPageSafe }} / {{ historyTotalPages }}
              </span>
              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-95 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                :disabled="!canHistoryPrev"
                @click="historyPrev"
                aria-label="Previous history page"
                title="Previous"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-95 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                :disabled="!canHistoryNext"
                @click="historyNext"
                aria-label="Next history page"
                title="Next"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="enrichedEvents.length === 0"
          class="flex min-h-60 flex-1 flex-col items-center justify-center gap-4 px-4 pb-6 text-center opacity-60"
        >
          <CalendarIcon class="size-12 text-slate-400" aria-hidden="true" />
          <p class="text-sm">No events recorded yet.</p>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
          <div class="space-y-4">
            <div
              v-for="event in pagedHistoryEvents"
              :key="event.id"
              class="flex items-start gap-4 rounded-xl border border-transparent p-4 transition-colors hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
              >
                {{ getTypeIcon(event.type) }}
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  <span>{{ getTypeLabel(event.type) }}</span>
                  for
                  <span class="font-bold text-emerald-700">{{
                    event.plantName
                  }}</span>
                </p>
                <p
                  v-if="event.notes"
                  class="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400"
                >
                  {{ event.notes }}
                </p>
                <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {{ formatEventDate(event.date) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
