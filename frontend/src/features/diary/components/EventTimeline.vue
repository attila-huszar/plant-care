<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
  import { getActionIcon, getBuiltinActionLabel } from '@/utils'
  import type {
    CustomEventType,
    EventType,
    Plant,
    PlantEvent,
  } from '../stores/diary'

  const props = defineProps<{
    events: PlantEvent[]
    plants: Plant[]
    customEventTypes?: CustomEventType[]
  }>()

  const emit = defineEmits<{
    'complete-care': [
      payload: { plantId: string; typeId: EventType; scheduledCareId?: string },
    ]
  }>()

  const DAY_MS = 1000 * 60 * 60 * 24
  const eventsTabIndex = ref(0)

  const customTypeNameById = computed(() => {
    const map = new Map<string, string>()
    for (const t of props.customEventTypes ?? []) {
      map.set(t.id, t.name)
    }
    return map
  })

  const latestEventMsByPlantAndType = computed(() => {
    const map = new Map<string, number>()
    for (const event of props.events) {
      const ms = new Date(event.date).getTime()
      if (!Number.isFinite(ms)) continue
      const key = `${event.plantId}:${event.typeId}`
      const prev = map.get(key)
      if (prev === undefined || ms > prev) map.set(key, ms)
    }
    return map
  })

  const getTypeLabel = (typeId: EventType) => {
    const builtin = getBuiltinActionLabel(typeId)
    if (builtin) return builtin
    return customTypeNameById.value.get(typeId) ?? typeId
  }

  type OccurrenceUpcomingItem = {
    key: string
    plantId: string
    plantName: string
    typeId: EventType
    dueDate: Date
    diffDays: number
    kind: 'occurrence'
    cadenceDays: number
  }

  type ScheduledUpcomingItem = {
    key: string
    plantId: string
    plantName: string
    typeId: EventType
    dueDate: Date
    diffDays: number
    kind: 'scheduled'
    scheduledCareId: string
  }

  type UpcomingItem = OccurrenceUpcomingItem | ScheduledUpcomingItem

  const upcomingCareAll = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    const items: UpcomingItem[] = []

    for (const plant of props.plants) {
      const occurrences = plant.occurrences ?? []
      for (const occurrence of occurrences) {
        if (!occurrence || occurrence.days <= 0) continue

        const key = `${plant.id}:${occurrence.typeId}`
        const lastEventMs = latestEventMsByPlantAndType.value.get(key)
        const plantAddedMs = plant.dateAdded
          ? new Date(plant.dateAdded).getTime()
          : Number.NaN

        const candidateMs =
          lastEventMs ??
          (Number.isFinite(plantAddedMs) ? plantAddedMs : Date.now())
        const baseMs = Number.isFinite(candidateMs) ? candidateMs : todayMs

        const dueDate = new Date(baseMs + occurrence.days * DAY_MS)
        const dueDay = new Date(dueDate)
        dueDay.setHours(0, 0, 0, 0)

        const diffDays = Math.round((dueDay.getTime() - todayMs) / DAY_MS)

        items.push({
          key,
          plantId: plant.id,
          plantName: plant.name,
          typeId: occurrence.typeId,
          dueDate,
          diffDays,
          kind: 'occurrence',
          cadenceDays: occurrence.days,
        })
      }

      for (const scheduled of plant.scheduledCare ?? []) {
        const dueDate = new Date(scheduled.date)
        if (!Number.isFinite(dueDate.getTime())) continue

        const dueDay = new Date(dueDate)
        dueDay.setHours(0, 0, 0, 0)

        const diffDays = Math.round(
          (dueDay.getTime() - today.getTime()) / DAY_MS,
        )

        items.push({
          key: `${plant.id}:${scheduled.id}`,
          plantId: plant.id,
          plantName: plant.name,
          typeId: scheduled.typeId,
          dueDate,
          diffDays,
          kind: 'scheduled',
          scheduledCareId: scheduled.id,
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

  const completingKeys = ref<Set<string>>(new Set())

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

  const completeItem = (item: (typeof upcomingCare.value)[number]) => {
    if (isCompleting(item.key)) return
    markCompleting(item.key)

    window.setTimeout(() => {
      emit('complete-care', {
        plantId: item.plantId,
        typeId: item.typeId,
        scheduledCareId:
          item.kind === 'scheduled' ? item.scheduledCareId : undefined,
      })
    }, 160)

    window.setTimeout(() => {
      unmarkCompleting(item.key)
    }, 700)
  }
</script>

<template>
  <section class="flex h-full flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Events
      </h2>
    </div>

    <div
      class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
    >
      <TabGroup
        as="div"
        :selectedIndex="eventsTabIndex"
        @change="(idx) => (eventsTabIndex = idx)"
        class="flex h-full flex-col overflow-hidden"
      >
        <div class="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
          <TabList
            class="flex gap-2 rounded-xl bg-slate-50 p-1 dark:bg-slate-950/50"
          >
            <Tab v-slot="{ selected }" as="template">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                :class="
                  selected
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                "
              >
                Upcoming
              </button>
            </Tab>
            <Tab v-slot="{ selected }" as="template">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                :class="
                  selected
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                "
              >
                History
              </button>
            </Tab>
          </TabList>
        </div>

        <TabPanels class="min-h-0 flex-1">
          <TabPanel class="h-full">
            <div v-if="upcomingCareAll.length === 0" class="px-4 py-4">
              <p class="text-sm text-slate-500 dark:text-slate-400">
                No upcoming care items. Add a schedule when creating a plant.
              </p>
            </div>

            <div v-else class="h-full overflow-y-auto px-2 pt-2 pb-2">
              <div
                v-for="item in upcomingCare"
                :key="item.key"
                class="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors"
                :class="
                  item.key === highlightedKey
                    ? 'bg-emerald-50/60'
                    : 'hover:bg-slate-50'
                "
              >
                <div class="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    {{ getActionIcon(item.typeId) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      <span class="capitalize">{{
                        getTypeLabel(item.typeId)
                      }}</span>
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
                      <span v-if="item.kind === 'occurrence'">
                        every {{ item.cadenceDays }} days
                      </span>
                      <span v-else>one-off</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all active:scale-95"
                  :class="
                    isCompleting(item.key)
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/60 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800'
                  "
                  @click.stop="completeItem(item)"
                  aria-label="Mark as done"
                  title="Mark as done"
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
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </TabPanel>

          <TabPanel class="h-full">
            <div
              v-if="enrichedEvents.length === 0"
              class="flex h-full min-h-60 flex-1 flex-col items-center justify-center gap-4 px-4 pb-6 text-center opacity-60"
            >
              <svg
                class="h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <p class="text-sm">No events recorded yet.</p>
            </div>

            <div v-else class="h-full overflow-y-auto px-4 pt-2 pb-4">
              <div class="space-y-4">
                <div
                  v-for="event in enrichedEvents"
                  :key="event.id"
                  class="flex items-start gap-4 rounded-xl border border-transparent p-4 transition-colors hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    {{ getActionIcon(event.typeId) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      <span class="capitalize">{{
                        getTypeLabel(event.typeId)
                      }}</span>
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
                    <p
                      class="mt-1 text-xs text-slate-400 capitalize dark:text-slate-500"
                    >
                      {{ formatEventDate(event.date) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  </section>
</template>
