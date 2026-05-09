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
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: () => import('../views/ChangelogView.vue')
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/LegalView.vue'),
      meta: { legalType: 'terms' }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/LegalView.vue'),
      meta: { legalType: 'privacy' }
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
      path: '/user/:userId',
      name: 'userProfile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/share/post/:shareToken',
      name: 'publicPost',
      component: () => import('../views/PublicPostView.vue')
    },
    {
      path: '/share/:shareToken',
      name: 'publicNote',
      component: () => import('../views/PublicNoteView.vue')
    },
    {
      path: '/setup-profile',
      name: 'setup-profile',
      component: () => import('../views/SetupProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth/callback/:provider',
      name: 'oauth-callback',
      component: () => import('../views/OAuthCallbackView.vue')
    },
    {
      path: '/auth/bind-callback/:provider',
      name: 'oauth-bind-callback',
      component: () => import('../views/OAuthBindCallbackView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth && !token) {
    next({
      name: 'landing',
      query: {
        auth: 'true',
        redirect: to.fullPath,
      },
    });
    return;
  }

  // OAuth callback route should always pass through
  if (to.name === 'oauth-callback') {
    next();
    return;
  }

  // Already logged in but visiting auth-related URLs → go to workspace
  if (token && (
    (to.name === 'landing' && to.query.auth) ||
    to.name === 'login' ||
    to.name === 'register'
  )) {
    next({ name: 'workspace' });
    return;
  }

  // Force setup-profile if nickname is missing
  if (token) {
    let authUser = null;
    try {
      authUser = JSON.parse(localStorage.getItem('authUser'));
    } catch { /* ignore */ }

    const hasNickname = Boolean(authUser?.nickname);

    if (!hasNickname && to.name !== 'setup-profile' && to.meta.requiresAuth) {
      next({ name: 'setup-profile' });
      return;
    }

    if (hasNickname && to.name === 'setup-profile') {
      next({ name: 'workspace' });
      return;
    }
  }

  next();
});

export default router
