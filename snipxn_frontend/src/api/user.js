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
