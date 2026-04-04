import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

let unsubscribe: (() => void) | null = null;
let lastOnlineState: boolean | null = null;

function resolveOnlineState(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function startNetworkMonitor(onOnline: () => void): void {
  stopNetworkMonitor();

  unsubscribe = NetInfo.addEventListener(state => {
    const nextOnlineState = resolveOnlineState(state);
    const previousOnlineState = lastOnlineState;

    lastOnlineState = nextOnlineState;

    if (previousOnlineState === false && nextOnlineState) {
      onOnline();
    }
  });
}

export function stopNetworkMonitor(): void {
  unsubscribe?.();
  unsubscribe = null;
  lastOnlineState = null;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return resolveOnlineState(state);
}
