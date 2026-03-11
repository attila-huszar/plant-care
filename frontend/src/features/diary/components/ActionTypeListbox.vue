<script setup lang="ts">
  import { computed } from 'vue'
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOption,
    ListboxOptions,
  } from '@headlessui/vue'
  import type { EventType } from '../stores/diary'

  const props = defineProps<{
    modelValue: EventType
    options: { id: EventType; label: string }[]
    label?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: EventType]
  }>()

  const labelById = computed(() => {
    const map = new Map<EventType, string>()
    for (const opt of props.options) map.set(opt.id, opt.label)
    return map
  })

  const selectedLabel = computed(() => {
    return labelById.value.get(props.modelValue) ?? String(props.modelValue)
  })
</script>

<template>
  <Listbox
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    as="div"
    class="relative"
  >
    <ListboxLabel
      v-if="label"
      class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
    >
      {{ label }}
    </ListboxLabel>

    <ListboxButton
      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
    >
      <span class="block truncate pr-8">{{ selectedLabel }}</span>
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
    </ListboxButton>

    <ListboxOptions
      as="ul"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg focus:outline-none dark:border-slate-800 dark:bg-slate-900"
    >
      <ListboxOption
        v-for="opt in options"
        :key="String(opt.id)"
        :value="opt.id"
        as="template"
        v-slot="{ active, selected }"
      >
        <li
          class="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2"
          :class="
            active
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
              : 'text-slate-700 dark:text-slate-200'
          "
        >
          <span
            class="truncate"
            :class="selected ? 'font-semibold' : 'font-medium'"
          >
            {{ opt.label }}
          </span>
          <span v-if="selected" class="text-emerald-600">✓</span>
        </li>
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
