<script setup lang="ts">
  import { computed, ref } from 'vue'
  import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxLabel,
    ComboboxOption,
    ComboboxOptions,
  } from '@headlessui/vue'
  import type { ScheduleActionId } from '@plant-care/shared'
  import { ChevronIcon } from '@/assets/svg'

  const props = defineProps<{
    modelValue: ScheduleActionId
    options: { id: ScheduleActionId; label: string }[]
    label?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: ScheduleActionId]
  }>()

  const query = ref('')

  const selectedOption = computed(() => {
    return props.options.find((o) => o.id === props.modelValue) ?? null
  })

  const filteredOptions = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return props.options
    return props.options.filter((opt) => opt.label.toLowerCase().includes(q))
  })

  const compareOptions = (
    a: { id: ScheduleActionId },
    b: { id: ScheduleActionId },
  ) => a.id === b.id

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    query.value = value
  }

  const handleSelect = (value: { id: ScheduleActionId } | null) => {
    if (!value) return
    emit('update:modelValue', value.id)
    query.value = ''
  }

  const openOnInputClick = (isOpen: boolean, event: MouseEvent) => {
    if (isOpen) return
    const input = event.currentTarget as HTMLInputElement
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      }),
    )
  }
</script>

<template>
  <Combobox
    as="div"
    class="relative"
    :by="compareOptions"
    :model-value="selectedOption"
    @update:model-value="handleSelect"
    v-slot="{ open }"
  >
    <ComboboxLabel
      v-if="label"
      class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
    >
      {{ label }}
    </ComboboxLabel>

    <div class="relative">
      <ComboboxInput
        as="template"
        :display-value="(opt) => (opt as { label: string } | null)?.label ?? ''"
      >
        <input
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-left text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
          placeholder="Type to search…"
          @input="handleInput"
          @click="openOnInputClick(open, $event)"
        />
      </ComboboxInput>

      <ComboboxButton as="template">
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
          tabindex="-1"
        >
          <ChevronIcon class="size-4" aria-hidden="true" />
        </button>
      </ComboboxButton>
    </div>

    <ComboboxOptions
      v-if="filteredOptions.length > 0"
      as="ul"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg focus:outline-none dark:border-slate-800 dark:bg-slate-900"
    >
      <ComboboxOption
        v-for="opt in filteredOptions"
        :key="String(opt.id)"
        :value="opt"
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
          <div class="min-w-0">
            <span
              class="truncate"
              :class="selected ? 'font-semibold' : 'font-medium'"
            >
              {{ opt.label }}
            </span>
          </div>

          <span v-if="selected" class="text-emerald-600">✓</span>
        </li>
      </ComboboxOption>
    </ComboboxOptions>
  </Combobox>
</template>
