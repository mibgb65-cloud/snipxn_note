import api from './axios';
import { getDeviceId, getDeviceName } from '../composables/useDeviceId';

export function checkEmail(email) {
  return api.post('/auth/check-email', { email });
}

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

export function oauthLogin(provider, code, redirectUri) {
  return api.post(`/auth/oauth/${provider}`, {
    code,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    redirectUri,
  });
}
