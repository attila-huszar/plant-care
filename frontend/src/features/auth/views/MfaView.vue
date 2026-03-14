<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useForm, useIsFieldTouched } from 'vee-validate'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { mfaCodeSchema } from '@plant-care/shared'
  import { PlantIcon } from '@/assets/svg'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const emailFromQuery = computed(() =>
    typeof route.query.email === 'string' ? route.query.email : '',
  )
  const redirect = computed(() =>
    typeof route.query.redirect === 'string' ? route.query.redirect : '/',
  )

  const apiError = ref<string | null>(null)

  const {
    handleSubmit,
    defineField,
    errors,
    submitCount,
    isSubmitting,
    setFieldError,
    setFieldValue,
  } = useForm({
    validationSchema: mfaCodeSchema,
    initialValues: {
      email: emailFromQuery.value,
      code: '',
    },
    validateOnMount: false,
  })

  watch(emailFromQuery, (email) => {
    setFieldValue('email', email, false)
  })

  const [code, codeAttrs] = defineField('code', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
  })

  const isCodeTouched = useIsFieldTouched('code')

  const showFieldError = (name: 'code') =>
    (isCodeTouched.value || submitCount.value > 0) &&
    Boolean(errors.value[name])

  const onSubmit = handleSubmit(async (values) => {
    apiError.value = null

    const result = await authStore.mfaVerify(values)

    if (!result.ok) {
      if (result.validation?.fieldErrors) {
        const codeMessage = result.validation.fieldErrors.code?.[0]
        if (codeMessage) setFieldError('code', codeMessage)
      }

      apiError.value = result.error
      return
    }

    await router.push(redirect.value)
  })
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-6">
    <div
      class="w-full max-w-md rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <div class="mb-10 text-center">
        <span
          class="mx-auto mb-6 inline-flex h-20 w-20 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_24px_currentColor)]"
        >
          <img :src="PlantIcon" alt="" aria-hidden="true" class="h-20 w-20" />
        </span>
        <h1
          class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
        >
          Check your email
        </h1>
        <p class="text-emerald-700/70 dark:text-slate-300">
          Enter the 6-digit code we sent to
          <span class="font-medium">{{ emailFromQuery || 'your email' }}</span>
        </p>
      </div>

      <div
        v-if="!emailFromQuery"
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        Missing email parameter. Please sign in again.
        <RouterLink to="/login" class="font-medium underline"
          >Go to login</RouterLink
        >
      </div>

      <form v-else @submit.prevent="onSubmit" class="space-y-6">
        <p
          v-if="apiError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
        >
          {{ apiError }}
        </p>

        <div>
          <label
            for="code"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >Code</label
          >
          <input
            v-model="code"
            v-bind="codeAttrs"
            id="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="123456"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-center text-lg tracking-[0.35em] text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showFieldError('code')"
            class="mt-2 text-sm text-red-700 dark:text-red-200"
          >
            {{ errors.code }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-95"
        >
          {{ isSubmitting ? 'Verifying...' : 'Verify & Continue' }}
        </button>

        <RouterLink
          to="/login"
          class="block text-center text-sm text-emerald-700 hover:text-emerald-900 dark:text-slate-300 dark:hover:text-white"
        >
          Back to login
        </RouterLink>
      </form>
    </div>
  </div>
</template>
