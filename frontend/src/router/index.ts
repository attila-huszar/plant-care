import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores'
import {
  ForgotPasswordView,
  LoginView,
  PasswordResetView,
  RegisterView,
  VerifyEmailView,
} from '@/features/auth/views'
import { DashboardView } from '@/features/diary/views'

let bootstrapPromise: Promise<void> | null = null

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

  bootstrapPromise ??= authStore.bootstrap().catch((err) => {
    bootstrapPromise = null
    throw err
  })
  await bootstrapPromise

  const isAuthed = authStore.isAuthenticated
  const isPublic = to.matched.some(
    (record) => Boolean(record.meta.public) || Boolean(record.meta.publicOnly),
  )
  const isPublicOnly = to.matched.some((record) =>
    Boolean(record.meta.publicOnly),
  )

  if (isPublicOnly && isAuthed) {
    return { name: 'dashboard' }
  }

  if (!isPublic && !isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
