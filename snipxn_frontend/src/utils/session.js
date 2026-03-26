import { getActivePinia } from 'pinia';

export function resetActiveStores(excludeIds = []) {
  const pinia = getActivePinia();

  if (!pinia?._s) {
    return;
  }

  for (const [storeId, store] of pinia._s.entries()) {
    if (excludeIds.includes(storeId)) {
      continue;
    }

    if (typeof store.$reset === 'function') {
      store.$reset();
    }
  }
}
