import api from './axios';

export function getProfile() {
  return api.get('/user/me');
}

export function updateProfile(payload) {
  return api.put('/user/me', payload);
}

export function updatePassword(payload) {
  return api.put('/user/me/password', payload);
}

export function getDevices() {
  return api.get('/user/me/devices');
}

export function deleteDevice(deviceId) {
  return api.delete(`/user/me/devices/${deviceId}`);
}

export function deleteOtherDevices() {
  return api.delete('/user/me/devices');
}

export function getLinkedAccounts() {
  return api.get('/user/me/linked-accounts');
}

export function bindOAuthAccount(provider, code, redirectUri) {
  const payload = { code };
  if (redirectUri) {
    payload.redirectUri = redirectUri;
  }
  return api.post(`/user/me/linked-accounts/${provider}`, payload);
}

export function unbindOAuthAccount(identityType) {
  return api.delete(`/user/me/linked-accounts/${identityType}`);
}

export function getStorageBreakdown() {
  return api.get('/notes/storage-breakdown');
}

export function getUserProfile(userId) {
  return api.get(`/follow/user/${userId}/profile`);
}
