import api from './axios';

export function reviewCode(payload) {
  return api.post('/ai/review', payload, { timeout: 60000 });
}

export function generateCode(payload) {
  return api.post('/ai/generate', payload, { timeout: 60000 });
}
