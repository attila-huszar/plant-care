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

  type ActionOption = {
    id: ScheduleActionId
    label: string
  }

  const props = defineProps<{
    modelValue: ScheduleActionId
    options: ActionOption[]
    label?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [ScheduleActionId]
  }>()

  const query = ref('')

  const selected = computed<ActionOption | null>(
    () => props.options.find((o) => o.id === props.modelValue) ?? null,
  )

  const filtered = computed<ActionOption[]>(() => {
    const q = query.value.trim().toLowerCase()
    return q
      ? props.options.filter((o) => o.label.toLowerCase().includes(q))
      : props.options
  })

  const update = (opt: ActionOption | null) => {
    if (!opt) return
    emit('update:modelValue', opt.id)
    query.value = ''
  }

  const onInput = (event: Event) => {
    query.value = (event.target as HTMLInputElement | null)?.value ?? ''
  }

  const onBlur = () => {
    query.value = ''
  }

  const openOnInputClick = (isOpen: boolean, event: MouseEvent) => {
    if (isOpen) return
    const input = event.currentTarget as HTMLInputElement | null
    if (!input) return

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      }),
    )
  }

  const displayValue = (o: unknown): string =>
    (o as ActionOption | null)?.label ?? ''
</script>

<template>
  <Combobox
    :model-value="selected"
    @update:model-value="update"
    v-slot="{ open }"
  >
    <div class="relative">
      <ComboboxLabel
        v-if="label"
        class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        {{ label }}
      </ComboboxLabel>

      <div class="relative">
        <ComboboxInput as="template" :display-value="displayValue">
          <input
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
            @input="onInput"
            @click="openOnInputClick(open, $event)"
            @blur="onBlur"
          />
        </ComboboxInput>

        <ComboboxButton
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
        >
          <ChevronIcon class="size-4" />
        </ComboboxButton>
      </div>

      <ComboboxOptions
        v-if="filtered.length"
        class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <ComboboxOption
          as="template"
          v-for="opt in filtered"
          :key="opt.id"
          :value="opt"
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
        </ComboboxOption>
      </ComboboxOptions>
    </div>
  </Combobox>
</template>
