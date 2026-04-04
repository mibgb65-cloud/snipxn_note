import type { ApiError } from '../../api';

import { isOnline } from './networkMonitor';
import { pullChanges } from './pullService';
import { pushChanges } from './pushService';

export type SyncResult = {
  status:
    | 'success'
    | 'offline'
    | 'already_syncing'
    | 'network_error'
    | 'auth_error'
    | 'error';
  message?: string;
};

let syncing = false;

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'number' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

function isNetworkError(error: unknown): boolean {
  if (isApiError(error)) {
    return (
      error.code === -1 ||
      error.message === '网络连接失败' ||
      error.message === '请求超时'
    );
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === 'Network Error' ||
    error.message.includes('timeout') ||
    error.message.includes('网络')
  );
}

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '同步失败';
}

async function runSyncTask(task: () => Promise<void>): Promise<SyncResult> {
  const online = await isOnline();

  if (!online) {
    return { status: 'offline' };
  }

  if (syncing) {
    return { status: 'already_syncing' };
  }

  syncing = true;

  try {
    await task();
    return { status: 'success' };
  } catch (error) {
    if (isApiError(error) && error.code === 401) {
      return { status: 'auth_error' };
    }

    if (isNetworkError(error)) {
      return { status: 'network_error', message: getErrorMessage(error) };
    }

    return { status: 'error', message: getErrorMessage(error) };
  } finally {
    syncing = false;
  }
}

export async function syncAll(): Promise<SyncResult> {
  return runSyncTask(async () => {
    await pushChanges();
    await pullChanges();
  });
}

export async function pushOnly(): Promise<SyncResult> {
  return runSyncTask(async () => {
    await pushChanges();
  });
}
