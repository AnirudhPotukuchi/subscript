import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  // Authentication Routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../modules/auth/views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../modules/auth/views/SignupView.vue'),
    meta: { guest: true }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../modules/auth/views/EmailVerifyView.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../modules/auth/views/ForgotView.vue'),
    meta: { guest: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../modules/auth/views/ResetView.vue'),
    meta: { guest: true }
  },
  // Main Panel Layout
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { auth: true },
    children: [
      {
        path: '',
        name: 'Feed',
        component: () => import('../modules/feed/views/FeedView.vue')
      },
      {
        path: 'profile/:id',
        name: 'Profile',
        component: () => import('../modules/profile/views/ProfileView.vue')
      },
      {
        path: 'interviews',
        name: 'Interviews',
        component: () => import('../modules/interviews/views/InterviewsView.vue')
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('../modules/resources/views/ResourcesView.vue')
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('../modules/search/views/SearchView.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../modules/admin/views/AdminView.vue'),
        meta: { admin: true }
      }
    ]
  },
  // Fallback Catch All redirect
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuth = authStore.isAuthenticated;

  if (to.meta.auth && !isAuth) {
    next('/login');
  } else if (to.meta.guest && isAuth) {
    next('/');
  } else if (to.meta.admin && !authStore.isAdmin) {
    next('/');
  } else {
    next();
  }
});

export default router;
