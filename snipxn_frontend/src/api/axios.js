import axios from 'axios';
import router from '../router';
import { getDeviceId } from '../composables/useDeviceId';
import { resetActiveStores } from '../utils/session';

function clearStoredAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
  resetActiveStores(['auth']);
}

async function redirectToLogin() {
  const currentRoute = router.currentRoute.value;
  const redirect = currentRoute?.meta?.requiresAuth ? currentRoute.fullPath : undefined;

  await router.push({
    name: 'landing',
    query: { auth: 'true', ...(redirect ? { redirect } : {}) },
  });
}

function extractErrorMessage(source, fallback = 'Request failed') {
  const messages = [];

  function pushMessage(value) {
    if (typeof value === 'string' && value.trim()) {
      messages.push(value.trim());
    }
  }

  function inspectPayload(payload) {
    if (!payload) return;

    if (typeof payload === 'string') {
      pushMessage(payload);
      return;
    }

    if (typeof payload !== 'object') {
      return;
    }

    pushMessage(payload.message);
    pushMessage(payload.msg);
    pushMessage(payload.detail);
    pushMessage(payload.error);
    pushMessage(payload.error_description);

    if (Array.isArray(payload.errors)) {
      for (const item of payload.errors) {
        if (typeof item === 'string') {
          pushMessage(item);
          break;
        }

        if (item && typeof item === 'object') {
          pushMessage(item.message);
          pushMessage(item.msg);
          pushMessage(item.defaultMessage);
          pushMessage(item.detail);

          if (messages.length) {
            break;
          }
        }
      }
    }

    if (payload.data && typeof payload.data === 'object') {
      pushMessage(payload.data.message);
      pushMessage(payload.data.msg);
      pushMessage(payload.data.detail);
    }
  }

  inspectPayload(source?.response?.data);
  inspectPayload(source?.data);
  pushMessage(source?.message);

  return messages[0] || fallback;
}

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 刷新锁：防止并发 401 请求同时触发 refresh 导致 token 重放检测
let refreshingPromise = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const result = response.data;

    if (result.code === 200 || result.code === 0) {
      return result;
    }

    return Promise.reject(new Error(extractErrorMessage(result)));
  },
  async (error) => {
    const originalRequest = error.config;
    const hasRefreshFailed = originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !hasRefreshFailed) {
      originalRequest._retry = true;

      // 如果已有 refresh 请求在进行中，排队等结果
      if (refreshingPromise) {
        try {
          const newToken = await refreshingPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }

      // 第一个 401 触发 refresh，后续 401 共享这个 promise
      refreshingPromise = (async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const res = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
          deviceId: getDeviceId(),
        });

        if (res.data?.code !== 200 && res.data?.code !== 0) {
          throw new Error(res.data?.message || 'Refresh failed');
        }

        const tokenData = res.data.data || {};
        localStorage.setItem('accessToken', tokenData.accessToken);
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        return tokenData.accessToken;
      })();

      try {
        const newToken = await refreshingPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredAuth();
        await redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        refreshingPromise = null;
      }
    }

    if (error.response?.status === 401) {
      clearStoredAuth();
      await redirectToLogin();
    }

    return Promise.reject(new Error(extractErrorMessage(error)));
  },
);

export default api;
