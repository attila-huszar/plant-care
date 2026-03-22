import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, useUserStore } from '@/features/auth/stores'
import {
  ForgotPasswordView,
  LoginView,
  MfaView,
  PasswordResetView,
  RegisterView,
  VerifyEmailView,
} from '@/features/auth/views'
import { DashboardView } from '@/features/diary/views'

let authInitPromise: Promise<void> | null = null

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { publicOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { publicOnly: true },
    },
    {
      path: '/verification',
      name: 'verification',
      component: VerifyEmailView,
      meta: { public: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { public: true },
    },
    {
      path: '/mfa',
      name: 'mfa',
      component: MfaView,
      meta: { public: true },
    },
    {
      path: '/password-reset',
      name: 'password-reset',
      component: PasswordResetView,
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  authInitPromise ??= authStore
    .refresh()
    .then(() => void 0)
    .catch((err) => {
      authInitPromise = null
      throw err
    })
  await authInitPromise

  if (authStore.isAuthenticated && !userStore.isReady) {
    await userStore.bootstrap()
  }

  const isPublic = to.matched.some(
    (record) => Boolean(record.meta.public) || Boolean(record.meta.publicOnly),
  )
  const isPublicOnly = to.matched.some((record) =>
    Boolean(record.meta.publicOnly),
  )

  if (authStore.isAuthenticated && isPublicOnly) {
    return { name: 'dashboard' }
  }

  if (!authStore.isAuthenticated && !isPublic) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
