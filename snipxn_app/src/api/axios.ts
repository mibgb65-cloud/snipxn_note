import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as Keychain from 'react-native-keychain';

import type { ApiResult, RefreshTokenRequest, TokenResponse } from '../types';
import { useAuthStore } from '../stores/authStore';
import { getDeviceId } from '../utils';

const REQUEST_TIMEOUT = 15_000;
const DEV_API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
const PROD_API_BASE_URL = 'https://snipxn.com/api/v1';
const AUTH_KEYCHAIN_SERVICE = 'snipxn.auth';
const AUTH_KEYCHAIN_USERNAME = 'token';
const REFRESH_ENDPOINT = '/auth/refresh';

interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  code: number;
  message: string;
}

interface ApiRequestConfig<D = unknown> extends InternalAxiosRequestConfig<D> {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

type UnauthorizedHandler = (() => void | Promise<void>) | null;

type TypedAxiosInstance = Omit<
  AxiosInstance,
  'request' | 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch'
> & {
  request<T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<T>;
  get<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  delete<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  head<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  options<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
};

let unauthorizedHandler: UnauthorizedHandler = null;
let refreshPromise: Promise<string> | null = null;

function resolveBaseUrl(): string {
  return __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL;
}

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'code' in value &&
    typeof value.code === 'number' &&
    'message' in value &&
    typeof value.message === 'string' &&
    'data' in value
  );
}

function unwrapApiResult<T>(value: ApiResult<T> | T): T {
  return isApiResult<T>(value) ? value.data : value;
}

function extractApiError(value: unknown): ApiError | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const code = 'code' in value && typeof value.code === 'number' ? value.code : null;
  const message =
    'message' in value && typeof value.message === 'string' ? value.message : null;

  if (code === null && message === null) {
    return null;
  }

  return {
    code: code ?? -1,
    message: message ?? '请求失败',
  };
}

function normalizeApiError(error: unknown): ApiError {
  const fallbackError = {
    code: -1,
    message: '请求失败',
  } satisfies ApiError;

  if (axios.isAxiosError(error)) {
    const responseError = extractApiError(error.response?.data);

    if (responseError !== null) {
      return responseError;
    }

    if (error.code === 'ECONNABORTED') {
      return {
        code: error.response?.status ?? -1,
        message: '请求超时',
      };
    }

    if (error.message === 'Network Error') {
      return {
        code: error.response?.status ?? -1,
        message: '网络连接失败',
      };
    }

    return {
      code: error.response?.status ?? -1,
      message: error.message || fallbackError.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: -1,
      message: error.message || fallbackError.message,
    };
  }

  return fallbackError;
}

function isRefreshRequest(config?: Pick<AxiosRequestConfig, 'url'>): boolean {
  return config?.url?.includes(REFRESH_ENDPOINT) ?? false;
}

export async function getStoredAuthTokens(): Promise<StoredAuthTokens | null> {
  const credentials = await Keychain.getGenericPassword({
    service: AUTH_KEYCHAIN_SERVICE,
  });

  if (!credentials) {
    return null;
  }

  try {
    const parsed = JSON.parse(credentials.password) as Partial<StoredAuthTokens>;

    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    };
  } catch {
    return null;
  }
}

export async function saveAuthTokens(tokens: StoredAuthTokens): Promise<void> {
  const result = await Keychain.setGenericPassword(
    AUTH_KEYCHAIN_USERNAME,
    JSON.stringify(tokens),
    {
      service: AUTH_KEYCHAIN_SERVICE,
    },
  );

  if (!result) {
    throw new Error('保存登录凭证失败');
  }
}

export async function clearAuthTokens(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: AUTH_KEYCHAIN_SERVICE,
  });
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

async function handleUnauthorized(): Promise<void> {
  await useAuthStore.getState().clearAuth();

  if (unauthorizedHandler !== null) {
    await Promise.resolve(unauthorizedHandler());
  }
}

async function attachAccessToken(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const storedTokens = await getStoredAuthTokens();
  const accessToken = storedTokens?.accessToken ?? useAuthStore.getState().accessToken;

  if (!accessToken) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  config.headers = headers;

  return config;
}

const baseConfig = {
  baseURL: resolveBaseUrl(),
  timeout: REQUEST_TIMEOUT,
};

const rawClient = axios.create(baseConfig);
const client = axios.create(baseConfig);

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise !== null) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const storedTokens = await getStoredAuthTokens();
    const refreshToken =
      storedTokens?.refreshToken ?? useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      throw new Error('缺少 refreshToken');
    }

    const deviceId = await getDeviceId();
    const payload: RefreshTokenRequest = {
      refreshToken,
      deviceId,
    };

    const response = await rawClient.post<
      ApiResult<TokenResponse>,
      AxiosResponse<ApiResult<TokenResponse>>,
      RefreshTokenRequest
    >(REFRESH_ENDPOINT, payload);
    const tokens = unwrapApiResult(response.data);

    await saveAuthTokens(tokens);

    const authStore = useAuthStore.getState();
    authStore.setAccessToken(tokens.accessToken);
    authStore.setRefreshToken(tokens.refreshToken);

    return tokens.accessToken;
  })()
    .catch(async error => {
      await handleUnauthorized();
      throw normalizeApiError(error);
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

client.interceptors.request.use(attachAccessToken);

client.interceptors.response.use(
  response => unwrapApiResult(response.data) as never,
  async error => {
    if (!axios.isAxiosError(error)) {
      throw normalizeApiError(error);
    }

    const originalRequest = error.config as ApiRequestConfig | undefined;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest !== undefined &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isRefreshRequest(originalRequest);

    if (!shouldRefresh) {
      throw normalizeApiError(error);
    }

    originalRequest._retry = true;

    try {
      const nextAccessToken = await refreshAccessToken();
      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set('Authorization', `Bearer ${nextAccessToken}`);
      originalRequest.headers = headers;

      return client.request(originalRequest);
    } catch (refreshError) {
      throw normalizeApiError(refreshError);
    }
  },
);

export const API_BASE_URL = baseConfig.baseURL;
export const apiClient = client as TypedAxiosInstance;

export default apiClient;

