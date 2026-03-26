import { defineStore } from 'pinia';
import * as authApi from '../api/auth';
import { resetActiveStores } from '../utils/session';

const AUTH_USER_KEY = 'authUser';

function readStoredUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser(),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
  },
  actions: {
    setUser(user) {
      this.user = user;

      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    },
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken || null;
      this.refreshToken = refreshToken || null;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        localStorage.removeItem('accessToken');
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
    },
    clearAuth() {
      this.setUser(null);
      this.setTokens(null, null);
      resetActiveStores(['auth']);
    },
    async login(email, password) {
      const res = await authApi.login(email, password);
      const token = res.data?.token || {};

      resetActiveStores(['auth']);
      this.setTokens(token.accessToken, token.refreshToken);
      this.setUser(res.data?.user || null);

      return res;
    },
    async register(email, code, password) {
      const res = await authApi.register(email, code, password);
      const token = res.data?.token || {};

      resetActiveStores(['auth']);
      this.setTokens(token.accessToken, token.refreshToken);
      this.setUser(res.data?.user || null);

      return res;
    },
    async oauthLogin(provider, code, redirectUri) {
      const res = await authApi.oauthLogin(provider, code, redirectUri);
      const token = res.data?.token || {};

      resetActiveStores(['auth']);
      this.setTokens(token.accessToken, token.refreshToken);
      this.setUser(res.data?.user || null);

      return res;
    },
    async resetPassword(email, code, newPassword) {
      return authApi.resetPassword(email, code, newPassword);
    },
    async sendCode(email, scene) {
      return authApi.sendCode(email, scene);
    },
    async logout() {
      try {
        await authApi.logout();
      } catch (error) {
        console.error(error);
      } finally {
        this.clearAuth();
      }
    },
  },
});
