import type { AppVersionPlatform, AppVersionResponse } from '../types';

import { apiClient } from './axios';

export async function checkLatestVersion(
  platform: AppVersionPlatform,
): Promise<AppVersionResponse | null> {
  const response = await apiClient.get<AppVersionResponse | null>(
    '/app/version/latest',
    { params: { platform } },
  );

  return response ?? null;
}
