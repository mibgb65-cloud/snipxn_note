import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue')
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: () => import('../views/MainView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/CommunityView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/community/:postId',
      name: 'postDetail',
      component: () => import('../views/PostDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth && !token) {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    });
  } else if (to.name === 'login' && token) {
    next({ name: 'workspace' });
  } else {
    next();
  }
});

export default router
