<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Switch,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import { useUserStore } from '@/features/auth/stores'

  const props = defineProps<{
    isOpen: boolean
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const userStore = useUserStore()

  const isSaving = ref(false)
  const apiError = ref<string | null>(null)
  const apiSuccess = ref<string | null>(null)

  const currentEnabled = computed(() => Boolean(userStore.profile?.mfaEnabled))
  const draftEnabled = ref(false)

  watch(
    () => props.isOpen,
    (open) => {
      if (!open) return
      apiError.value = null
      apiSuccess.value = null
      draftEnabled.value = currentEnabled.value
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
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
