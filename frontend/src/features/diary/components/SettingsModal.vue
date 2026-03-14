<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { PLANT_CARE_META } from '@/constants'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Switch,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import { useUserStore } from '@/features/auth/stores'
  import { usePlantsStore } from '@/features/diary/stores'

  const props = defineProps<{
    isOpen: boolean
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const userStore = useUserStore()
  const plantsStore = usePlantsStore()

  const isSaving = ref(false)
  const apiError = ref<string | null>(null)
  const apiSuccess = ref<string | null>(null)

  const currentEnabled = computed(() => Boolean(userStore.profile?.mfaEnabled))
  const draftEnabled = ref(false)

  const customEvents = computed(() => {
    return [...userStore.customEvents].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  })

  const customEventUsageById = computed(() => {
    const counts = new Map<string, number>()

    for (const plant of plantsStore.plants ?? []) {
      for (const rule of plant.careRules ?? []) {
        if (!rule?.type) continue
        counts.set(rule.type, (counts.get(rule.type) ?? 0) + 1)
      }

      for (const event of plant.history ?? []) {
        if (!event?.type) continue
        counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
      }
    }

    return counts
  })

  const canRemoveCustomEvent = (id: string) => {
    return (customEventUsageById.value.get(id) ?? 0) === 0
  }

  const newCustomEventName = ref('')
  const editingCustomEventId = ref<string | null>(null)
  const editingCustomEventName = ref('')

  const reservedTypeIdsLower = new Set(
    PLANT_CARE_META.map((t) => t.id.toLowerCase()),
  )

  const createReserved = computed(() => {
    const nextName = newCustomEventName.value.trim().toLowerCase()
    if (!nextName) return false
    return reservedTypeIdsLower.has(nextName)
  })

  const createDuplicate = computed(() => {
    const nextName = newCustomEventName.value.trim().toLowerCase()
    if (!nextName) return false
    return userStore.customEvents.some(
      (evt) => evt.name.trim().toLowerCase() === nextName,
    )
  })

  const createInvalid = computed(
    () => createReserved.value || createDuplicate.value,
  )

  const renameConflict = computed(() => {
    const id = editingCustomEventId.value
    if (!id) return false

    const nextName = editingCustomEventName.value.trim().toLowerCase()
    if (!nextName) return false

    return userStore.customEvents.some(
      (evt) => evt.id !== id && evt.name.trim().toLowerCase() === nextName,
    )
  })

  const renameReserved = computed(() => {
    const id = editingCustomEventId.value
    if (!id) return false

    const nextName = editingCustomEventName.value.trim().toLowerCase()
    if (!nextName) return false
    return reservedTypeIdsLower.has(nextName)
  })

  const renameInvalid = computed(
    () => renameConflict.value || renameReserved.value,
  )

  watch(
    () => props.isOpen,
    (open) => {
      if (!open) return
      apiError.value = null
      apiSuccess.value = null
      draftEnabled.value = currentEnabled.value
      newCustomEventName.value = ''
      editingCustomEventId.value = null
      editingCustomEventName.value = ''
    },
  )

  const setMfaEnabled = async (next: boolean) => {
    if (!userStore.profile) return
    if (isSaving.value) return

    apiError.value = null
    apiSuccess.value = null

    const prev = draftEnabled.value
    draftEnabled.value = next

    isSaving.value = true
    try {
      const result = await userStore.toggleMfa(next)
      if (!result.ok) {
        draftEnabled.value = prev
        apiError.value = result.error
        return
      }

      apiSuccess.value = next ? 'MFA enabled' : 'MFA disabled'
    } finally {
      isSaving.value = false
    }
  }

  const addCustomEvent = async () => {
    if (!userStore.profile) return
    if (userStore.customEventsLoading) return

    apiError.value = null
    apiSuccess.value = null

    if (createReserved.value) {
      apiError.value = 'Name is reserved'
      return
    }

    if (createDuplicate.value) {
      apiError.value = 'Name already exists'
      return
    }

    const result = await userStore.createCustomEvent(newCustomEventName.value)
    if (!result.ok) {
      apiError.value = result.error
      return
    }

    newCustomEventName.value = ''
    apiSuccess.value = 'Custom event added'
  }

  const startRename = (id: string, currentName: string) => {
    editingCustomEventId.value = id
    editingCustomEventName.value = currentName
    apiError.value = null
    apiSuccess.value = null
  }

  const cancelRename = () => {
    editingCustomEventId.value = null
    editingCustomEventName.value = ''
  }

  const saveRename = async () => {
    if (!userStore.profile) return
    if (userStore.customEventsLoading) return
    if (!editingCustomEventId.value) return

    apiError.value = null
    apiSuccess.value = null

    const nextName = editingCustomEventName.value.trim()
    if (!nextName) return
    if (renameReserved.value) {
      apiError.value = 'Name is reserved'
      return
    }
    if (renameConflict.value) {
      apiError.value = 'Custom event name already exists'
      return
    }

    const result = await userStore.renameCustomEvent(
      editingCustomEventId.value,
      nextName,
    )

    if (!result.ok) {
      apiError.value = result.error
      return
    }

    apiSuccess.value = 'Custom event updated'
    cancelRename()
  }

  const removeCustomEvent = async (id: string, name: string) => {
    if (!userStore.profile) return
    if (userStore.customEventsLoading) return
    if (!canRemoveCustomEvent(id)) return

    apiError.value = null
    apiSuccess.value = null

    const confirmed = window.confirm(`Remove custom event "${name}"?`)
    if (!confirmed) return

    const result = await userStore.removeCustomEvent(id)
    if (!result.ok) {
      apiError.value = result.error
      return
    }

    if (editingCustomEventId.value === id) cancelRename()
    apiSuccess.value = 'Custom event removed'
  }

  const handleClose = () => emit('close')
</script>

<template>
  <TransitionRoot as="template" :show="props.isOpen">
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
            class="w-full max-w-lg transform-gpu overflow-visible rounded-3xl border border-white/20 bg-white shadow-2xl will-change-transform dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="px-6 py-6 sm:p-8">
              <div class="mb-6 flex items-start justify-between gap-4">
                <div>
                  <DialogTitle
                    class="text-xl font-semibold text-emerald-900 dark:text-slate-100"
                  >
                    Settings
                  </DialogTitle>
                  <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Manage account security options.
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  @click="handleClose"
                  aria-label="Close"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <p
                v-if="apiError"
                class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
              >
                {{ apiError }}
              </p>
              <p
                v-if="apiSuccess"
                class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                {{ apiSuccess }}
              </p>

              <div
                class="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30"
              >
                <div class="flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <p
                      class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      Email-based MFA
                    </p>
                    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Receive a 6-digit code by email on login (expires in 10
                      minutes).
                    </p>
                  </div>

                  <Switch
                    :model-value="draftEnabled"
                    :disabled="isSaving || !userStore.profile"
                    @update:model-value="setMfaEnabled"
                    class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 dark:focus:ring-offset-slate-950"
                    :class="
                      draftEnabled
                        ? 'bg-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    "
                  >
                    <span class="sr-only">Toggle MFA</span>
                    <span
                      class="inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white transition"
                      :class="draftEnabled ? 'translate-x-7' : 'translate-x-1'"
                    />
                  </Switch>
                </div>
              </div>

              <div
                class="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30"
              >
                <div class="mb-4 flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p
                      class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      Custom events
                    </p>
                    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Add, rename, or remove your custom care event types.
                    </p>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="flex gap-2">
                    <input
                      v-model="newCustomEventName"
                      type="text"
                      autocomplete="off"
                      placeholder="New event name"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-emerald-500/30 outline-none focus:ring-4 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                      :class="
                        createInvalid ? 'border-rose-300 ring-rose-500/30' : ''
                      "
                      :disabled="
                        !userStore.profile || userStore.customEventsLoading
                      "
                      @keyup.enter="addCustomEvent"
                    />
                    <button
                      type="button"
                      class="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      :disabled="
                        !userStore.profile ||
                        userStore.customEventsLoading ||
                        !newCustomEventName.trim() ||
                        createInvalid
                      "
                      @click="addCustomEvent"
                      :title="
                        createReserved
                          ? 'Name is reserved'
                          : createDuplicate
                            ? 'Name already exists'
                            : 'Add'
                      "
                    >
                      Add
                    </button>
                  </div>

                  <div
                    v-if="customEvents.length === 0"
                    class="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
                  >
                    No custom events yet.
                  </div>

                  <ul v-else class="space-y-2">
                    <li
                      v-for="evt in customEvents"
                      :key="evt.id"
                      class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                      <div class="min-w-0 flex-1">
                        <div
                          v-if="editingCustomEventId === evt.id"
                          class="flex gap-2"
                        >
                          <input
                            v-model="editingCustomEventName"
                            type="text"
                            autocomplete="off"
                            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-emerald-500/30 outline-none focus:ring-4 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                            :class="
                              renameInvalid
                                ? 'border-rose-300 ring-rose-500/30'
                                : ''
                            "
                            :disabled="userStore.customEventsLoading"
                            @keyup.enter="saveRename"
                            @keyup.esc="cancelRename"
                          />
                          <button
                            type="button"
                            class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                            :disabled="
                              userStore.customEventsLoading ||
                              !editingCustomEventName.trim() ||
                              renameInvalid
                            "
                            @click="saveRename"
                            :title="
                              renameReserved
                                ? 'Name is reserved'
                                : renameConflict
                                  ? 'Name already exists'
                                  : 'Save'
                            "
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            :disabled="userStore.customEventsLoading"
                            @click="cancelRename"
                          >
                            Cancel
                          </button>
                        </div>

                        <div v-else class="flex items-center gap-2">
                          <p
                            class="truncate text-sm font-medium text-slate-900 dark:text-slate-100"
                          >
                            {{ evt.name }}
                          </p>
                          <span
                            v-if="(customEventUsageById.get(evt.id) ?? 0) > 0"
                            class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            :title="`Used ${customEventUsageById.get(evt.id)} times`"
                          >
                            In use
                          </span>
                        </div>
                      </div>

                      <div
                        v-if="editingCustomEventId !== evt.id"
                        class="flex shrink-0 items-center gap-2"
                      >
                        <button
                          type="button"
                          class="inline-flex size-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-95 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          :disabled="userStore.customEventsLoading"
                          @click="startRename(evt.id, evt.name)"
                          title="Rename"
                          aria-label="Rename"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            fill="currentColor"
                            class="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M416.9 85.2 372 130.1 509.9 268l44.9-44.9c13.6-13.5 21.2-31.9 21.2-51.1s-7.6-37.6-21.2-51.1l-35.7-35.7C505.6 71.6 487.2 64 468 64s-37.6 7.6-51.1 21.2M338.1 164 122.9 379.1c-10.7 10.7-18.5 24.1-22.6 38.7L64.9 545.6c-2.3 8.3 0 17.3 6.2 23.4s15.1 8.5 23.4 6.2l127.8-35.5c14.6-4.1 27.9-11.8 38.7-22.6l215-215.2z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="inline-flex size-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
                          :disabled="
                            userStore.customEventsLoading ||
                            !canRemoveCustomEvent(evt.id)
                          "
                          :title="
                            canRemoveCustomEvent(evt.id)
                              ? 'Remove'
                              : 'Remove is disabled while this event is used by plants or history'
                          "
                          @click="removeCustomEvent(evt.id, evt.name)"
                          aria-label="Remove"
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
                    </li>
                  </ul>

                  <p
                    v-if="userStore.customEventsError"
                    class="text-sm text-red-600 dark:text-red-300"
                  >
                    {{ userStore.customEventsError }}
                  </p>
                </div>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
