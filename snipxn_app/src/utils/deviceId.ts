import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUniqueId } from 'react-native-device-info';

const DEVICE_ID_STORAGE_KEY = '@snipxn/device-id';
const DEVICE_ID_PREFIX = 'Android_';

let cachedDeviceId: string | null = null;
let pendingDeviceIdPromise: Promise<string> | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId !== null) {
    return cachedDeviceId;
  }

  if (pendingDeviceIdPromise !== null) {
    return pendingDeviceIdPromise;
  }

  pendingDeviceIdPromise = (async () => {
    try {
      const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

      if (storedDeviceId) {
        cachedDeviceId = storedDeviceId;
        return storedDeviceId;
      }
    } catch {
      // Fall back to generating a new device id.
    }

    const uniqueId = await getUniqueId();
    const deviceId = `${DEVICE_ID_PREFIX}${uniqueId}`;

    cachedDeviceId = deviceId;

    try {
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    } catch {
      // Ignore cache write failures and keep the in-memory value.
    }

    return deviceId;
  })().finally(() => {
    pendingDeviceIdPromise = null;
  });

  return pendingDeviceIdPromise;
}
