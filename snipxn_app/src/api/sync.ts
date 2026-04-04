import type { SyncPullResponse, SyncPushRequest } from '../types';

import { apiClient } from './axios';

const SYNC_BASE_URL = '/sync';

export function pull(lastPulledAt?: string): Promise<SyncPullResponse> {
  return apiClient.get<SyncPullResponse>(`${SYNC_BASE_URL}/pull`, {
    params: {
      lastPulledAt,
    },
  });
}

export function push(req: SyncPushRequest): Promise<void> {
  return apiClient.post<void, SyncPushRequest>(`${SYNC_BASE_URL}/push`, req);
}
