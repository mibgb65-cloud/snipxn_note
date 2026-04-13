import { getDeviceName } from 'react-native-device-info';
import { create } from 'zustand';

import {
  clearAuthTokens,
  getStoredAuthTokens,
  saveAuthTokens,
} from '../api/axios';
import * as authApi from '../api/auth';
import * as userApi from '../api/user';
import { getOAuthRedirectUri, type OAuthProvider } from '../config/oauth';
import { initDatabase, resetDatabase } from '../db/database';
import type { GoogleUserInfo } from '../services/googleSignIn';
import type { LoginResponse, User } from '../types';
import { getDeviceId } from '../utils/deviceId';
import { toISOString } from '../utils/time';

const DEFAULT_DEVICE_NAME = 'Android Device';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider, code: string) => Promise<void>;
  loginWithGoogleMobile: (info: GoogleUserInfo) => Promise<void>;
  register: (email: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setAccessToken: (accessToken: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
}

type AuthStateSnapshot = Pick<
  AuthState,
  'user' | 'accessToken' | 'refreshToken' | 'isAuthenticated' | 'isNewUser'
>;

const initialAuthState: AuthStateSnapshot = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isNewUser: false,
};

function applyAuthState(
  set: (partial: Partial<AuthState>) => void,
  nextState: Partial<AuthStateSnapshot>,
): void {
  const accessToken = nextState.accessToken;

  set({
    ...nextState,
    isAuthenticated:
      accessToken !== undefined ? accessToken !== null : nextState.isAuthenticated,
  });
}

async function resolveDeviceName(): Promise<string> {
  try {
    const deviceName = await getDeviceName();

    if (deviceName.trim().length > 0) {
      return deviceName;
    }
  } catch {
    // Fall back to a generic Android device name.
  }

  return DEFAULT_DEVICE_NAME;
}

function isMissingNickname(user: Pick<User, 'nickname'> | null): boolean {
  return user?.nickname == null || user.nickname.trim().length === 0;
}

function buildSessionUser(
  email: string,
  response: LoginResponse,
  previousUser: User | null,
): User {
  const now = toISOString();

  return {
    id: response.userInfo.id,
    email: response.userInfo.email ?? email,
    nickname: response.userInfo.nickname,
    avatar: response.userInfo.avatar,
    bio: response.userInfo.bio,
    gender: response.userInfo.gender ?? previousUser?.gender ?? 0,
    birthday: response.userInfo.birthday ?? previousUser?.birthday ?? null,
    website: response.userInfo.website ?? previousUser?.website ?? null,
    github: response.userInfo.github ?? previousUser?.github ?? null,
    location: response.userInfo.location ?? previousUser?.location ?? null,
    company: response.userInfo.company ?? previousUser?.company ?? null,
    techStack: response.userInfo.techStack ?? previousUser?.techStack ?? null,
    storageLimit: response.userInfo.storageLimit,
    storageUsed: response.userInfo.storageUsed,
    status: response.userInfo.status ?? previousUser?.status ?? 'ACTIVE',
    createdAt: response.userInfo.createdAt ?? previousUser?.createdAt ?? now,
    updatedAt: response.userInfo.updatedAt ?? now,
  };
}

async function runInitialSync(): Promise<void> {
  const { useSyncStore } = await import('./syncStore');
  const result = await useSyncStore.getState().syncNow();

  if (result.status === 'auth_error') {
    throw new Error('登录状态已失效');
  }

  if (result.status === 'error' || result.status === 'network_error') {
    console.warn('Initial sync completed with a non-fatal error.', result);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialAuthState,
  login: async (email, password) => {
    await initDatabase();

    const [deviceId, deviceName] = await Promise.all([getDeviceId(), resolveDeviceName()]);
    const response = await authApi.login({
      email,
      password,
      deviceId,
      deviceName,
    });

    await saveAuthTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    const sessionUser = buildSessionUser(email, response, get().user);

    applyAuthState(set, {
      user: sessionUser,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isNewUser: response.isNewUser,
    });

    try {
      const latestUser = await userApi.getMe();
      set({
        user: latestUser,
        isNewUser: response.isNewUser || isMissingNickname(latestUser),
      });
    } catch (error) {
      console.warn('Failed to fetch the latest user profile after login.', error);
    }

    try {
      await runInitialSync();
    } catch (error) {
      console.warn('Failed to complete the initial sync after login.', error);
    }
  },
  loginWithOAuth: async (provider, code) => {
    await initDatabase();

    const [deviceId, deviceName] = await Promise.all([getDeviceId(), resolveDeviceName()]);

    const response =
      provider === 'github'
        ? await authApi.oauthGithub(code, getOAuthRedirectUri(), deviceId, deviceName)
        : await authApi.oauthGoogle(code, '', deviceId, deviceName);

    await saveAuthTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    const sessionUser = buildSessionUser('', response, get().user);

    applyAuthState(set, {
      user: sessionUser,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isNewUser: response.isNewUser,
    });

    try {
      const latestUser = await userApi.getMe();
      set({
        user: latestUser,
        isNewUser: response.isNewUser || isMissingNickname(latestUser),
      });
    } catch (error) {
      console.warn('Failed to fetch the latest user profile after OAuth login.', error);
    }

    try {
      await runInitialSync();
    } catch (error) {
      console.warn('Failed to complete the initial sync after OAuth login.', error);
    }
  },
  loginWithGoogleMobile: async (info) => {
    await initDatabase();

    const [deviceId, deviceName] = await Promise.all([getDeviceId(), resolveDeviceName()]);

    const response = await authApi.oauthGoogleMobile(
      info.googleId, info.email, info.name, info.avatar, deviceId, deviceName,
    );

    await saveAuthTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    const sessionUser = buildSessionUser(info.email, response, get().user);

    applyAuthState(set, {
      user: sessionUser,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isNewUser: response.isNewUser,
    });

    try {
      const latestUser = await userApi.getMe();
      set({
        user: latestUser,
        isNewUser: response.isNewUser || isMissingNickname(latestUser),
      });
    } catch (error) {
      console.warn('Failed to fetch the latest user profile after Google mobile login.', error);
    }

    try {
      await runInitialSync();
    } catch (error) {
      console.warn('Failed to complete the initial sync after Google mobile login.', error);
    }
  },
  register: async (email, code, password) => {
    const [deviceId, deviceName] = await Promise.all([getDeviceId(), resolveDeviceName()]);

    await authApi.register({
      email,
      code,
      password,
      deviceId,
      deviceName,
    });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Failed to revoke the server session during logout.', error);
    } finally {
      await get().clearAuth();
    }
  },
  refreshTokens: async () => {
    const refreshToken = get().refreshToken ?? (await getStoredAuthTokens())?.refreshToken;

    if (!refreshToken) {
      await get().clearAuth();
      throw new Error('缺少 refreshToken');
    }

    const tokens = await authApi.refresh({
      refreshToken,
      deviceId: await getDeviceId(),
    });

    await saveAuthTokens(tokens);
    applyAuthState(set, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },
  setUser: user => {
    set({
      user,
      isNewUser: isMissingNickname(user),
    });
  },
  clearAuth: async () => {
    await clearAuthTokens();
    set(initialAuthState);

    try {
      const [
        { resetCommunityStore },
        { resetFolderStore },
        { resetNoteStore },
        { resetUserStore },
        { resetSyncStore },
      ] = await Promise.all([
        import('./communityStore'),
        import('./folderStore'),
        import('./noteStore'),
        import('./userStore'),
        import('./syncStore'),
      ]);
      resetCommunityStore();
      resetFolderStore();
      resetNoteStore();
      resetUserStore();
      resetSyncStore();
    } catch {
      // Ignore optional store reset failures.
    }

    await resetDatabase();
  },
  restoreSession: async () => {
    await initDatabase();

    const storedTokens = await getStoredAuthTokens();

    if (!storedTokens) {
      set(initialAuthState);
      return;
    }

    applyAuthState(set, {
      accessToken: storedTokens.accessToken,
      refreshToken: storedTokens.refreshToken,
      isAuthenticated: true,
    });

    try {
      const latestUser = await userApi.getMe();
      set({
        user: latestUser,
        isNewUser: isMissingNickname(latestUser),
      });
    } catch (error) {
      await get().clearAuth();
      throw error;
    }
  },
  setAccessToken: accessToken => {
    applyAuthState(set, {
      accessToken,
    });
  },
  setRefreshToken: refreshToken => {
    set({ refreshToken });
  },
}));
