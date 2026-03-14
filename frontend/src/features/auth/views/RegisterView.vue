<script setup lang="ts">
  import { computed, ref, unref } from 'vue'
  import type { MaybeRef } from 'vue'
  import { useForm, useIsFieldTouched } from 'vee-validate'
  import { RouterLink } from 'vue-router'
  import {
    registerFormSchema,
    type RegisterFormValues,
  } from '@plant-care/shared'
  import { getEmailProviderInbox } from '@/utils'
  import { PlantIcon } from '@/assets/svg'
  import { useAuthStore } from '../stores/auth'

  const authStore = useAuthStore()

  const apiError = ref<string | null>(null)
  const createdEmail = ref<string | null>(null)

  const inboxLink = computed(() =>
    createdEmail.value ? getEmailProviderInbox(createdEmail.value) : null,
  )

  const inboxUrl = computed(() => inboxLink.value?.url ?? '/login')
  const inboxLabel = computed(() =>
    inboxLink.value?.name ? `Open ${inboxLink.value.name}` : 'Back to login',
  )

  const {
    handleSubmit,
    defineField,
    errors,
    submitCount,
    isSubmitting,
    setFieldError,
  } = useForm<RegisterFormValues>({
    validationSchema: registerFormSchema,
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validateOnMount: false,
  })

  const [firstName, firstNameAttrs] = defineField('firstName', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
  })

  const [lastName, lastNameAttrs] = defineField('lastName', {
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false,
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

  const [confirmPassword, confirmPasswordAttrs] = defineField(
    'confirmPassword',
    {
      validateOnBlur: true,
      validateOnInput: false,
      validateOnChange: false,
      validateOnModelUpdate: false,
    },
  )

  const isFirstNameTouched = useIsFieldTouched('firstName')
  const isLastNameTouched = useIsFieldTouched('lastName')
  const isEmailTouched = useIsFieldTouched('email')
  const isPasswordTouched = useIsFieldTouched('password')
  const isConfirmPasswordTouched = useIsFieldTouched('confirmPassword')

  const showFieldError = (
    touched: MaybeRef<boolean>,
    name: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword',
  ) => (unref(touched) || submitCount.value > 0) && Boolean(errors.value[name])

  const onSubmit = handleSubmit(async (values) => {
    apiError.value = null
    createdEmail.value = null

    const result = await authStore.register(values)

    if (!result.ok) {
      if (result.validation?.fieldErrors) {
        const firstNameMessage = result.validation.fieldErrors.firstName?.[0]
        if (firstNameMessage) setFieldError('firstName', firstNameMessage)

        const lastNameMessage = result.validation.fieldErrors.lastName?.[0]
        if (lastNameMessage) setFieldError('lastName', lastNameMessage)

        const emailMessage = result.validation.fieldErrors.email?.[0]
        if (emailMessage) setFieldError('email', emailMessage)

        const passwordMessage = result.validation.fieldErrors.password?.[0]
        if (passwordMessage) setFieldError('password', passwordMessage)
      }

      apiError.value = result.error
      return
    }

    createdEmail.value = result.data.email
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
          <img :src="PlantIcon" alt="" aria-hidden="true" class="h-20 w-20" />
        </span>
        <h1
          class="mb-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-slate-100"
        >
          Create Account
        </h1>
        <p class="text-emerald-700/70 dark:text-slate-300">
          We will send a verification email
        </p>
      </div>

      <div
        v-if="createdEmail"
        class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100"
      >
        <p class="font-medium">Check your email</p>
        <p class="mt-1 opacity-90">
          We sent a verification link to
          <span class="font-semibold">{{ createdEmail }}</span
          >.
        </p>
        <a
          :href="inboxUrl"
          class="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
        >
          {{ inboxLabel }}
        </a>
      </div>

      <form v-else @submit.prevent="onSubmit" class="space-y-5">
        <p
          v-if="apiError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
        >
          {{ apiError }}
        </p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="firstName"
              class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
              >First name</label
            >
            <input
              v-model="firstName"
              v-bind="firstNameAttrs"
              id="firstName"
              type="text"
              required
              placeholder="Ava"
              class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <p
              v-if="showFieldError(isFirstNameTouched, 'firstName')"
              class="mt-2 text-sm text-red-700 dark:text-red-200"
            >
              {{ errors.firstName }}
            </p>
          </div>

          <div>
            <label
              for="lastName"
              class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
              >Last name</label
            >
            <input
              v-model="lastName"
              v-bind="lastNameAttrs"
              id="lastName"
              type="text"
              required
              placeholder="Green"
              class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <p
              v-if="showFieldError(isLastNameTouched, 'lastName')"
              class="mt-2 text-sm text-red-700 dark:text-red-200"
            >
              {{ errors.lastName }}
            </p>
          </div>
        </div>

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
            placeholder="At least 6 chars, letters + numbers"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showFieldError(isPasswordTouched, 'password')"
            class="mt-2 text-sm text-red-700 dark:text-red-200"
          >
            {{ errors.password }}
          </p>
        </div>

        <div>
          <label
            for="confirmPassword"
            class="mb-2 block text-sm font-medium text-emerald-900 dark:text-slate-200"
            >Confirm password</label
          >
          <input
            v-model="confirmPassword"
            v-bind="confirmPasswordAttrs"
            id="confirmPassword"
            type="password"
            required
            placeholder="Re-enter your password"
            class="w-full rounded-xl border border-emerald-100 bg-white/50 px-4 py-3 text-emerald-900 placeholder-emerald-300 shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p
            v-if="showFieldError(isConfirmPasswordTouched, 'confirmPassword')"
            class="mt-2 text-sm text-red-700 dark:text-red-200"
          >
            {{ errors.confirmPassword }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-95"
        >
          {{ isSubmitting ? 'Creating...' : 'Create account' }}
        </button>

        <div class="text-center text-sm">
          <RouterLink
            to="/login"
            class="font-medium text-emerald-700 hover:text-emerald-900 dark:text-slate-200 dark:hover:text-white"
          >
            Already have an account? Sign in
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
