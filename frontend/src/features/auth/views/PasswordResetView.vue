<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useForm, useIsFieldTouched } from 'vee-validate'
  import { RouterLink, useRoute } from 'vue-router'
  import { passwordResetSchema, tokenSchema } from '@plant-care/shared'
  import { PlantIcon } from '@/assets/svg'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()
  const route = useRoute()

  const apiError = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const tokenStatus = ref<'checking' | 'valid' | 'invalid'>('checking')

  const token = computed(() =>
    typeof route.query.token === 'string' ? route.query.token : null,
  )

  const {
    handleSubmit,
    defineField,
    errors,
    submitCount,
    isSubmitting,
    setFieldError,
    setFieldValue,
  } = useForm({
    validationSchema: passwordResetSchema,
    initialValues: {
      token: '',
      password: '',
    },
    validateOnMount: false,
  })

  const [password, passwordAttrs] = defineField('password', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
  })

  const isPasswordTouched = useIsFieldTouched('password')

  const showPasswordError = computed(
    () =>
      (isPasswordTouched.value || submitCount.value > 0) &&
      Boolean(errors.value.password),
  )

  onMounted(async () => {
    const parsed = tokenSchema.safeParse({ token: token.value })
    if (!parsed.success) {
      tokenStatus.value = 'invalid'
      apiError.value = 'Invalid password reset token'
      return
    }

    setFieldValue('token', parsed.data.token, false)
    const result = await authStore.validatePasswordResetToken(parsed.data)

    if (!result.ok) {
      tokenStatus.value = 'invalid'
      apiError.value = result.error
      return
    }

    tokenStatus.value = 'valid'
  })

  const onSubmit = handleSubmit(async (values) => {
    apiError.value = null
    successMessage.value = null

    const result = await authStore.submitPasswordReset(values)

    if (!result.ok) {
      if (result.validation?.fieldErrors) {
        const tokenMessage = result.validation.fieldErrors.token?.[0]
        if (tokenMessage) setFieldError('token', tokenMessage)

        const passwordMessage = result.validation.fieldErrors.password?.[0]
        if (passwordMessage) setFieldError('password', passwordMessage)
      }
      apiError.value = result.error
      return
    }

    successMessage.value = result.data.message
  })
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-6">
    <div
      class="w-full max-w-md rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <div class="mb-8 text-center">
        <span
          class="mx-auto mb-6 inline-flex h-20 w-20 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_24px_currentColor)]"
        >
          <PlantIcon class="size-20" aria-hidden="true" />
        </span>
        <h1
          class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
        >
          Reset Password
        </h1>
        <p class="text-emerald-700/70 dark:text-slate-300">
          Choose a new password
        </p>
      </div>

      <div
        v-if="tokenStatus === 'checking'"
        class="rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"
      >
        Validating reset link...
      </div>

      <div
        v-else-if="successMessage"
        class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100"
      >
        {{ successMessage }}
        <div class="mt-4">
          <RouterLink
            to="/login"
            class="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
          >
            Sign in
          </RouterLink>
        </div>
      </div>

      <div
        v-else-if="tokenStatus === 'invalid'"
        class="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
      >
        {{ apiError }}
        <div class="mt-4">
          <RouterLink
            to="/forgot-password"
            class="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
          >
            Request a new link
          </RouterLink>
        </div>
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
            for="password"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >New password</label
          >
          <input
            v-model="password"
            v-bind="passwordAttrs"
            id="password"
            type="password"
            required
            placeholder="At least 6 chars, letters + numbers"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showPasswordError"
            class="mt-2 text-sm text-red-700 dark:text-red-200"
          >
            {{ errors.password }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-95"
        >
          {{ isSubmitting ? 'Saving...' : 'Set new password' }}
        </button>

        <div class="text-center text-sm">
          <RouterLink
            to="/login"
            class="font-medium text-emerald-700 hover:text-emerald-900 dark:text-slate-200 dark:hover:text-white"
          >
            Back to login
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
