import { Platform } from 'react-native';
import { create } from 'zustand';

import { checkLatestVersion } from '../api/appVersion';
import { getCurrentAppLanguage } from '../i18n';
import type { AppVersionInfo, AppVersionPlatform } from '../types';
import {
  buildUpdateMessage,
  compareVersionStrings,
  getInstalledAppVersionInfo,
  normalizeAppVersionResponse,
} from '../utils/appUpdate';

export type AppUpdateCheckResult = {
  status: 'up_to_date' | 'update_available' | 'error';
  currentVersion: string;
  latestVersionInfo?: AppVersionInfo | null;
  message?: string;
};

interface AppUpdateState {
  currentVersion: string;
  currentBuildNumber: string | null;
  latestVersionInfo: AppVersionInfo | null;
  checking: boolean;
  checkForUpdates: () => Promise<AppUpdateCheckResult>;
}

function getPlatform(): AppVersionPlatform {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

const installedVersion = getInstalledAppVersionInfo();

export const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  currentVersion: installedVersion.version,
  currentBuildNumber: installedVersion.buildNumber,
  latestVersionInfo: null,
  checking: false,
  checkForUpdates: async () => {
    const latestInstalledVersion = getInstalledAppVersionInfo();
    const language = getCurrentAppLanguage();

    set({
      checking: true,
      currentVersion: latestInstalledVersion.version,
      currentBuildNumber: latestInstalledVersion.buildNumber,
    });

    try {
      const response = await checkLatestVersion(getPlatform());

      if (!response) {
        set({ checking: false });
        return {
          status: 'up_to_date',
          currentVersion: latestInstalledVersion.version,
          latestVersionInfo: get().latestVersionInfo,
          message:
            language === 'en-US'
              ? 'The app is already up to date.'
              : '当前已经是最新版本。',
        };
      }

      const normalizedVersionInfo = normalizeAppVersionResponse(response);
      const hasNewVersion =
        compareVersionStrings(normalizedVersionInfo.version, latestInstalledVersion.version) > 0;

      set({
        checking: false,
        latestVersionInfo: normalizedVersionInfo,
      });

      if (!hasNewVersion) {
        return {
          status: 'up_to_date',
          currentVersion: latestInstalledVersion.version,
          latestVersionInfo: normalizedVersionInfo,
          message:
            language === 'en-US' ? 'The app is already up to date.' : '当前已经是最新版本。',
        };
      }

      return {
        status: 'update_available',
        currentVersion: latestInstalledVersion.version,
        latestVersionInfo: normalizedVersionInfo,
        message: buildUpdateMessage(normalizedVersionInfo, language),
      };
    } catch (error) {
      set({ checking: false });
      return {
        status: 'error',
        currentVersion: latestInstalledVersion.version,
        latestVersionInfo: get().latestVersionInfo,
        message: getErrorMessage(
          error,
          language === 'en-US'
            ? 'Failed to check for updates. Please try again later.'
            : '检查更新失败，请稍后重试。',
        ),
      };
    }
  },
}));
