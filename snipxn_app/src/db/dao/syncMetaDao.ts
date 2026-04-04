import { getDeviceId as resolveDeviceId } from '../../utils/deviceId';
import { getDatabase } from '../database';

import { DEVICE_ID_META_KEY, LAST_PULLED_AT_META_KEY, getFirstRow } from './internal';

interface MetaRow {
  value: string | null;
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await getFirstRow<MetaRow>(
    getDatabase(),
    'SELECT value FROM sync_meta WHERE key = ? LIMIT 1',
    [key],
  );

  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await getDatabase().execute(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export function getLastPulledAt(): Promise<string | null> {
  return getMeta(LAST_PULLED_AT_META_KEY);
}

export function setLastPulledAt(time: string): Promise<void> {
  return setMeta(LAST_PULLED_AT_META_KEY, time);
}

export async function getDeviceId(): Promise<string> {
  const storedDeviceId = await getMeta(DEVICE_ID_META_KEY);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = await resolveDeviceId();
  await setMeta(DEVICE_ID_META_KEY, deviceId);

  return deviceId;
}
