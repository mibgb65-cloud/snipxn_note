import { create } from 'zustand';

import * as noteApi from '../api/note';
import * as userApi from '../api/user';
import { useAuthStore } from './authStore';
import type {
  LinkedAccount,
  StorageBreakdownResponse,
  UpdateMeRequest,
  User,
  UserDevice,
} from '../types';

export interface UserState {
  profile: User | null;
  devices: UserDevice[];
  linkedAccounts: LinkedAccount[];
  storageBreakdown: StorageBreakdownResponse | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  fetchDevices: () => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  revokeOtherDevices: () => Promise<void>;
  fetchLinkedAccounts: () => Promise<void>;
  fetchStorageBreakdown: () => Promise<void>;
}

const initialUserState = {
  profile: null,
  devices: [],
  linkedAccounts: [],
  storageBreakdown: null,
} satisfies Pick<UserState, 'profile' | 'devices' | 'linkedAccounts' | 'storageBreakdown'>;

function buildUpdateProfilePayload(data: Partial<User>): UpdateMeRequest {
  const payload: UpdateMeRequest = {};

  if ('nickname' in data) {
    payload.nickname = data.nickname ?? null;
  }

  if ('avatar' in data) {
    payload.avatar = data.avatar ?? null;
  }

  if ('bio' in data) {
    payload.bio = data.bio ?? null;
  }

  if ('gender' in data && typeof data.gender === 'number') {
    payload.gender = data.gender;
  }

  if ('birthday' in data) {
    payload.birthday = data.birthday ?? null;
  }

  if ('website' in data) {
    payload.website = data.website ?? null;
  }

  if ('github' in data) {
    payload.github = data.github ?? null;
  }

  if ('location' in data) {
    payload.location = data.location ?? null;
  }

  if ('company' in data) {
    payload.company = data.company ?? null;
  }

  if ('techStack' in data) {
    payload.techStack = data.techStack ?? null;
  }

  return payload;
}

function setProfileState(
  set: (partial: Partial<UserState>) => void,
  user: User,
): void {
  set({ profile: user });
  useAuthStore.getState().setUser(user);
}

export const useUserStore = create<UserState>(set => ({
  ...initialUserState,
  fetchProfile: async () => {
    const profile = await userApi.getMe();
    setProfileState(set, profile);
  },
  updateProfile: async data => {
    const payload = buildUpdateProfilePayload(data);
    const profile = await userApi.updateMe(payload);
    setProfileState(set, profile);
  },
  changePassword: async password => {
    await userApi.changePassword(password);
  },
  fetchDevices: async () => {
    const devices = await userApi.getDevices();
    set({ devices });
  },
  revokeDevice: async deviceId => {
    await userApi.revokeDevice(deviceId);
    set(state => ({
      devices: state.devices.filter(device => device.deviceId !== deviceId),
    }));
  },
  revokeOtherDevices: async () => {
    const currentProfile = useAuthStore.getState().user;
    await userApi.revokeOtherDevices();

    if (!currentProfile) {
      set({ devices: [] });
      return;
    }

    await useUserStore.getState().fetchDevices();
  },
  fetchLinkedAccounts: async () => {
    const linkedAccounts = await userApi.getLinkedAccounts();
    set({ linkedAccounts });
  },
  fetchStorageBreakdown: async () => {
    const storageBreakdown = await noteApi.getStorageBreakdown();
    set({ storageBreakdown });
  },
}));

export function resetUserStore(): void {
  useUserStore.setState(initialUserState);
}
