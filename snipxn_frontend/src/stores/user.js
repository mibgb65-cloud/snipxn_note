import { defineStore } from 'pinia';
import * as userApi from '../api/user';
import { uploadFile } from '../api/file';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    devices: [],
    linkedAccounts: [],
    loadingProfile: false,
    loadingDevices: false,
    loadingLinkedAccounts: false,
    savingProfile: false,
    changingPassword: false,
    storageBreakdown: null,
    loadingStorageBreakdown: false,
  }),
  getters: {
    storageUsagePercent: (state) => {
      const limit = Number(state.profile?.storageLimit || 0);
      const used = Number(state.profile?.storageUsed || 0);

      if (!limit) {
        return 0;
      }

      return Math.min(100, Math.round((used / limit) * 100));
    },
  },
  actions: {
    async fetchProfile() {
      this.loadingProfile = true;

      try {
        const res = await userApi.getProfile();
        const nextProfile = res.data || null;

        if (nextProfile && !nextProfile.avatar && this.profile?.avatar) {
          nextProfile.avatar = this.profile.avatar;
        }

        this.profile = nextProfile;
        useAuthStore().setUser(this.profile);

        return this.profile;
      } finally {
        this.loadingProfile = false;
      }
    },
    async updateProfile(payload) {
      this.savingProfile = true;

      try {
        await userApi.updateProfile(payload);
        await this.fetchProfile();
      } finally {
        this.savingProfile = false;
      }
    },
    async updatePassword(payload) {
      this.changingPassword = true;

      try {
        return await userApi.updatePassword(payload);
      } finally {
        this.changingPassword = false;
      }
    },
    async fetchDevices() {
      this.loadingDevices = true;

      try {
        const res = await userApi.getDevices();
        this.devices = res.data || [];
        return this.devices;
      } finally {
        this.loadingDevices = false;
      }
    },
    async deleteDevice(deviceId) {
      await userApi.deleteDevice(deviceId);
      await this.fetchDevices();
    },
    async deleteOtherDevices() {
      await userApi.deleteOtherDevices();
      await this.fetchDevices();
    },
    async fetchLinkedAccounts() {
      this.loadingLinkedAccounts = true;

      try {
        const res = await userApi.getLinkedAccounts();
        this.linkedAccounts = res.data || [];
        return this.linkedAccounts;
      } finally {
        this.loadingLinkedAccounts = false;
      }
    },
    async bindOAuth(provider, code, redirectUri) {
      await userApi.bindOAuthAccount(provider, code, redirectUri);
      await this.fetchLinkedAccounts();
    },
    async unbindOAuth(identityType) {
      await userApi.unbindOAuthAccount(identityType);
      await this.fetchLinkedAccounts();
    },
    async fetchStorageBreakdown() {
      this.loadingStorageBreakdown = true;

      try {
        const res = await userApi.getStorageBreakdown();
        this.storageBreakdown = res.data || null;
        return this.storageBreakdown;
      } finally {
        this.loadingStorageBreakdown = false;
      }
    },
    async uploadAvatar(file) {
      const res = await uploadFile(file);
      const avatar = res.data?.url || (res.data?.fileId ? `/api/v1/files/${res.data.fileId}` : '');

      if (avatar) {
        await userApi.updateProfile({ avatar });
        await this.fetchProfile();
      }

      return avatar;
    },
  },
});
