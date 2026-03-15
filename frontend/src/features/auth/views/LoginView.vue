<script setup lang="ts">
  import { ref, unref } from 'vue'
  import type { MaybeRef } from 'vue'
  import { useForm, useIsFieldTouched } from 'vee-validate'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { loginSchema } from '@plant-care/shared'
  import { PlantIcon } from '@/assets/svg'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const apiError = ref<string | null>(null)

  const {
    handleSubmit,
    defineField,
    errors,
    submitCount,
    isSubmitting,
    setFieldError,
  } = useForm({
    validationSchema: loginSchema,
    initialValues: {
      email: '',
      password: '',
    },
    validateOnMount: false,
  })

  const [email, emailAttrs] = defineField('email', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
  })

  const [password, passwordAttrs] = defineField('password', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
  })

  const isEmailTouched = useIsFieldTouched('email')
  const isPasswordTouched = useIsFieldTouched('password')

  const showFieldError = (
    touched: MaybeRef<boolean>,
    name: 'email' | 'password',
  ) => (unref(touched) || submitCount.value > 0) && Boolean(errors.value[name])

  const onSubmit = handleSubmit(async (values) => {
    apiError.value = null

    const result = await authStore.login(values)

    if (!result.ok) {
      if (result.validation?.fieldErrors) {
        const emailMessage = result.validation.fieldErrors.email?.[0]
        if (emailMessage) setFieldError('email', emailMessage)

        const passwordMessage = result.validation.fieldErrors.password?.[0]
        if (passwordMessage) setFieldError('password', passwordMessage)
      }

      apiError.value = result.error
      return
    }

    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/'

    if ('mfaPending' in result.data) {
      await router.push({
        name: 'mfa',
        query: { email: result.data.email, redirect },
      })
      return
    }

    await router.push(redirect)
  })
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-6">
    <div
      class="w-full max-w-md rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <!-- Brand Header -->
      <div class="mb-10 text-center">
        <span
          class="mx-auto mb-6 inline-flex h-20 w-20 text-emerald-400/60 filter-[drop-shadow(0_0_0px_currentColor)] transition-[filter] duration-300 hover:filter-[drop-shadow(0_0_24px_currentColor)]"
        >
          <PlantIcon class="size-20" aria-hidden="true" />
        </span>
        <h1
          class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
        >
          Plant Care Diary
        </h1>
        <p class="text-emerald-700/70 dark:text-slate-300">
          Sign in to track your green friends
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="onSubmit" class="space-y-6">
        <p
          v-if="apiError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
        >
          {{ apiError }}
        </p>

        <div>
          <label
            for="email"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >Email</label
          >
          <input
            v-model="email"
            v-bind="emailAttrs"
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showFieldError(isEmailTouched, 'email')"
            class="mt-2 text-sm text-red-700 dark:text-red-200"
          >
            {{ errors.email }}
          </p>
        </div>

        <div>
          <label
            for="password"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >Password</label
          >
          <input
            v-model="password"
            v-bind="passwordAttrs"
            id="password"
            type="password"
            required
            placeholder="Your password"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showFieldError(isPasswordTouched, 'password')"
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
          {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
        </button>

        <div class="flex items-center justify-between text-sm">
          <RouterLink
            to="/forgot-password"
            class="text-emerald-700 hover:text-emerald-900 dark:text-slate-300 dark:hover:text-white"
          >
            Forgot password?
          </RouterLink>
          <RouterLink
            to="/register"
            class="font-medium text-emerald-700 hover:text-emerald-900 dark:text-slate-200 dark:hover:text-white"
          >
            Create account
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
