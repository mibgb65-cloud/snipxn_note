import { getBuildNumber, getVersion } from 'react-native-device-info';

import { getCurrentAppLanguage } from '../i18n';
import type { AppVersionInfo, AppVersionResponse } from '../types';
import type { AppLanguage } from './preferences';

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toNumberParts(version: string): number[] {
  return version
    .split(/[^0-9]+/)
    .filter(part => part.length > 0)
    .map(part => Number.parseInt(part, 10));
}

export function compareVersionStrings(left: string, right: string): number {
  const leftParts = toNumberParts(left);
  const rightParts = toNumberParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

export function formatInstalledVersionLabel(
  version: string,
  buildNumber?: string | null,
): string {
  if (buildNumber && buildNumber.trim().length > 0) {
    return `${version} (${buildNumber})`;
  }

  return version;
}

export function getInstalledAppVersionInfo(): { version: string; buildNumber: string | null } {
  return {
    version: getVersion(),
    buildNumber: normalizeString(getBuildNumber()),
  };
}

export function normalizeAppVersionResponse(response: AppVersionResponse): AppVersionInfo {
  return {
    version: response.version,
    buildNumber: normalizeString(response.buildNumber ?? response.build_number),
    updateUrl: normalizeString(response.updateUrl ?? response.update_url),
    releaseNotes: normalizeString(response.releaseNotes ?? response.release_notes) ?? null,
    publishedAt: normalizeString(response.publishedAt ?? response.published_at),
  };
}

export function buildUpdateMessage(
  versionInfo: AppVersionInfo,
  language: AppLanguage = getCurrentAppLanguage(),
): string {
  const latestVersionLabel = formatInstalledVersionLabel(
    versionInfo.version,
    versionInfo.buildNumber,
  );

  return language === 'en-US'
    ? `Version ${latestVersionLabel} is available. You can update now.`
    : `发现新版本 ${latestVersionLabel}，你可以前往更新。`;
}
