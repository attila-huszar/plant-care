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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
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
  await authStore.bootstrap()

  const isAuthed = authStore.isAuthenticated
  const isPublic = Boolean(to.meta.public) || Boolean(to.meta.publicOnly)
  const isPublicOnly = Boolean(to.meta.publicOnly)

  if (isPublicOnly && isAuthed) {
    return { name: 'dashboard' }
  }

  if (!isPublic && !isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
