<script setup lang="ts">
  import { computed } from 'vue'
  import {
    Popover,
    PopoverButton,
    PopoverPanel,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import type {
    CustomEventDto,
    EventDto,
    EventType,
    PlantDto,
  } from '@plant-care/shared'
  import {
    buildCustomEventsMap,
    formatMediumDate as formatCalendarDate,
    formatRelativeDay,
    getEventIcon,
    getEventLabel,
  } from '@/features/diary/utils'
  import { PlantIcon, PlusIcon, TrashIcon } from '@/assets/svg'

  const props = defineProps<{
    plants: PlantDto[]
    events: EventDto[]
    customEvents: CustomEventDto[]
  }>()

  const emit = defineEmits<{
    'add-plant': []
    'edit-plant': [payload: { plantId: number }]
    'remove-plant': [payload: { plantId: number }]
  }>()

  const customTypeNameById = computed(() => {
    return buildCustomEventsMap(props.customEvents)
  })

  const lastEventByPlantId = computed(() => {
    const map = new Map<number, { iso: string; ms: number; type: EventType }>()

    for (const event of props.events) {
      const ms = new Date(event.date).getTime()
      if (!Number.isFinite(ms)) continue
      const current = map.get(event.plantId)
      if (!current || ms > current.ms) {
        map.set(event.plantId, { iso: event.date, ms, type: event.type })
      }
    }

    return map
  })

  const plantCards = computed(() => {
    const lastByPlantId = lastEventByPlantId.value
    return props.plants.map((plant) => ({
      plant,
      lastEvent: lastByPlantId.get(plant.id) ?? null,
    }))
  })
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        My Plants
      </h2>
      <button
        @click="emit('add-plant')"
        class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95"
      >
        <PlusIcon class="size-5" aria-hidden="true" />
        Add Plant
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="plants.length === 0"
      class="rounded-2xl border border-emerald-100 bg-white/50 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div
        class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500"
      >
        <PlantIcon class="size-8" aria-hidden="true" />
      </div>
      <h3
        class="mb-2 text-lg font-semibold text-emerald-900 dark:text-slate-100"
      >
        No plants yet
      </h3>
      <p class="text-emerald-700/70 dark:text-slate-300">
        Click 'Add Plant' to start your indoor garden journey.
      </p>
    </div>

    <!-- Plant Grid -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div
        v-for="card in plantCards"
        :key="card.plant.id"
        role="button"
        tabindex="0"
        @click="emit('edit-plant', { plantId: card.plant.id })"
        @keydown.enter.prevent="emit('edit-plant', { plantId: card.plant.id })"
        @keydown.space.prevent="emit('edit-plant', { plantId: card.plant.id })"
        class="group relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-emerald-400 dark:focus-visible:ring-offset-slate-950"
      >
        <Popover v-slot="{ open, close }" class="absolute top-3 right-3">
          <PopoverButton
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition-all group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
            :class="open ? 'opacity-100' : ''"
            title="Remove plant"
            aria-label="Remove plant"
            @click.stop
            @keydown.enter.stop
            @keydown.space.stop
          >
            <TrashIcon class="size-4" aria-hidden="true" />
          </PopoverButton>

          <TransitionRoot as="template" :show="open">
            <TransitionChild
              as="template"
              enter="ease-out duration-150"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-100"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <PopoverPanel
                class="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-xl focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                @click.stop
              >
                <p class="font-semibold text-slate-900 dark:text-slate-100">
                  Remove plant?
                </p>
                <p class="mt-1 text-slate-600 dark:text-slate-300">
                  This will permanently remove
                  <span class="font-medium">{{ card.plant.name }}</span
                  >.
                </p>

                <div class="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    @click="close()"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-500"
                    @click="
                      (emit('remove-plant', { plantId: card.plant.id }),
                      close())
                    "
                  >
                    Remove
                  </button>
                </div>
              </PopoverPanel>
            </TransitionChild>
          </TransitionRoot>
        </Popover>

        <div
          class="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-emerald-100 to-green-100 text-emerald-600 shadow-inner transition-transform duration-300 group-hover:scale-105"
        >
          <PlantIcon class="size-12" aria-hidden="true" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
            {{ card.plant.name }}
          </h3>

          <div
            v-if="card.lastEvent"
            class="mt-2 flex flex-wrap justify-center gap-2"
          >
            <span class="sr-only">Last event</span>
            <span
              class="self-center text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
              Done
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-200"
              :title="getEventLabel(card.lastEvent.type, customTypeNameById)"
            >
              <span aria-hidden="true">{{
                getEventIcon(card.lastEvent.type)
              }}</span>
              <span class="truncate">{{
                getEventLabel(card.lastEvent.type, customTypeNameById)
              }}</span>
            </span>
            <span
              class="self-center text-sm font-semibold text-slate-600 dark:text-slate-300"
              :title="formatCalendarDate(card.lastEvent.iso)"
            >
              {{ formatRelativeDay(card.lastEvent.iso) }}
            </span>
          </div>

          <p v-else class="mt-1 text-xs text-slate-400 dark:text-slate-500">
            No events yet
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
