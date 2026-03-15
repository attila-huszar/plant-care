<script setup lang="ts">
  import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
  } from '@headlessui/vue'
  import type { EventType } from '@plant-care/shared'
  import { ChevronIcon, TrashIcon } from '@/assets/svg'
  import ActionTypeListbox from './ActionTypeListbox.vue'

  type DraftCareRuleRow = {
    key: string
    id: string
    kind: 'recurring' | 'date'
    type: EventType
    days: string
    date: string
    notes: string
  }

  type CareRulesEditorProps = {
    ruleRows: DraftCareRuleRow[]
    typeOptions: { id: EventType; label: string }[]
    addRuleRow: () => void
    removeRuleRow(_key: string): void
    setRowKind(_row: DraftCareRuleRow, _kind: DraftCareRuleRow['kind']): void
  }

  defineProps<CareRulesEditorProps>()
</script>

<template>
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
        class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="w-full shrink-0 sm:w-32">
            <label
              class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Kind
            </label>
            <Listbox
              v-model="row.kind"
              as="div"
              class="relative"
              @update:model-value="setRowKind(row, $event)"
            >
              <ListboxButton
                class="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
              >
                <span class="truncate">
                  {{ row.kind === 'recurring' ? 'Recurring' : 'One-off' }}
                </span>
                <ChevronIcon class="size-4 text-slate-400" aria-hidden="true" />
              </ListboxButton>

              <ListboxOptions
                class="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <ListboxOption
                  value="recurring"
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
                    <span :class="selected ? 'font-semibold' : 'font-medium'">
                      Recurring
                    </span>
                    <span v-if="selected" class="text-emerald-600"> ✓ </span>
                  </li>
                </ListboxOption>

                <ListboxOption
                  value="date"
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
                    <span :class="selected ? 'font-semibold' : 'font-medium'">
                      One-off
                    </span>
                    <span v-if="selected" class="text-emerald-600"> ✓ </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </Listbox>
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
            class="inline-flex size-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
            @click="removeRuleRow(row.key)"
            aria-label="Remove action"
            title="Remove"
          >
            <TrashIcon class="size-4" aria-hidden="true" />
          </button>
        </div>

        <div class="min-w-0">
          <label
            class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Notes (optional)
          </label>
          <textarea
            v-model="row.notes"
            rows="2"
            maxlength="1000"
            placeholder="Helpful notes for this task"
            class="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
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
</template>
