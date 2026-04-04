import { create } from 'zustand';

import { pushOnly, syncAll as performSyncAll, type SyncResult } from '../db/sync/syncEngine';
import { isOnline } from '../db/sync/networkMonitor';

const SUCCESS_VISIBLE_MS = 2000;
const DEFAULT_PUSH_DELAY_MS = 3000;
const PUSH_RETRY_DELAY_MS = 1500;

type SyncIndicatorStatus = 'idle' | 'syncing' | 'success' | 'offline' | 'error';

export interface SyncState {
  status: SyncIndicatorStatus;
  message: string | null;
  syncNow: () => Promise<SyncResult>;
  pushNow: () => Promise<SyncResult>;
  schedulePush: (delayMs?: number) => Promise<void>;
  cancelScheduledPush: () => void;
  setOffline: (message?: string) => void;
  reset: () => void;
}

const initialSyncState = {
  status: 'idle',
  message: null,
} satisfies Pick<SyncState, 'status' | 'message'>;

let successTimer: ReturnType<typeof setTimeout> | null = null;
let scheduledPushTimer: ReturnType<typeof setTimeout> | null = null;

function clearSuccessTimer(): void {
  if (successTimer !== null) {
    clearTimeout(successTimer);
    successTimer = null;
  }
}

function clearScheduledPushTimer(): void {
  if (scheduledPushTimer !== null) {
    clearTimeout(scheduledPushTimer);
    scheduledPushTimer = null;
  }
}

function scheduleSuccessReset(): void {
  clearSuccessTimer();
  successTimer = setTimeout(() => {
    useSyncStore.setState(state =>
      state.status === 'success'
        ? {
            status: 'idle',
            message: null,
          }
        : state,
    );
  }, SUCCESS_VISIBLE_MS);
}

function applyResult(result: SyncResult): void {
  clearSuccessTimer();

  if (result.status === 'success') {
    useSyncStore.setState({ status: 'success', message: null });
    scheduleSuccessReset();
    return;
  }

  if (result.status === 'offline') {
    useSyncStore.setState({
      status: 'offline',
      message: '当前离线，修改已保存在本地。',
    });
    return;
  }

  if (result.status === 'already_syncing') {
    useSyncStore.setState({ status: 'syncing', message: null });
    return;
  }

  useSyncStore.setState({
    status: 'error',
    message:
      result.message ??
      (result.status === 'auth_error' ? '登录状态已失效，请重新登录。' : '同步失败，请稍后重试。'),
  });
}

async function runSyncOperation(operation: () => Promise<SyncResult>): Promise<SyncResult> {
  clearSuccessTimer();
  useSyncStore.setState({ status: 'syncing', message: null });

  const result = await operation();
  applyResult(result);
  return result;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  ...initialSyncState,
  syncNow: async () => {
    get().cancelScheduledPush();
    return runSyncOperation(performSyncAll);
  },
  pushNow: async () => runSyncOperation(pushOnly),
  schedulePush: async (delayMs = DEFAULT_PUSH_DELAY_MS) => {
    const online = await isOnline();

    if (!online) {
      get().setOffline();
      return;
    }

    clearScheduledPushTimer();

    scheduledPushTimer = setTimeout(() => {
      scheduledPushTimer = null;

      void (async () => {
        const result = await get().pushNow();

        if (result.status === 'already_syncing') {
          await get().schedulePush(PUSH_RETRY_DELAY_MS);
        }
      })();
    }, delayMs);
  },
  cancelScheduledPush: () => {
    clearScheduledPushTimer();
  },
  setOffline: (message = '当前离线，修改已保存在本地。') => {
    clearSuccessTimer();
    set({ status: 'offline', message });
  },
  reset: () => {
    clearSuccessTimer();
    clearScheduledPushTimer();
    set(initialSyncState);
  },
}));

export function resetSyncStore(): void {
  useSyncStore.getState().reset();
}
