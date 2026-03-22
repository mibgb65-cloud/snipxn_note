const DEVICE_ID_KEY = 'deviceId';

function generateFallbackId() {
  return `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getDeviceId() {
  if (typeof window === 'undefined') {
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : generateFallbackId();

    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function getDeviceName() {
  if (typeof navigator === 'undefined') return 'Unknown Device';

  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  return `${browser} on ${os}`;
}

export function useDeviceId() {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  };
}
