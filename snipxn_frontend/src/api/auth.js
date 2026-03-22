import api from './axios';
import { getDeviceId, getDeviceName } from '../composables/useDeviceId';

export function sendCode(email, scene) {
  return api.post('/auth/code', { email, scene });
}

export function register(email, code, password) {
  return api.post('/auth/register', {
    email,
    code,
    password,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  });
}

export function login(email, password) {
  return api.post('/auth/login', {
    email,
    password,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  });
}

export function resetPassword(email, code, newPassword) {
  return api.post('/auth/reset-password', { email, code, newPassword });
}

export function logout() {
  return api.post('/auth/logout');
}
