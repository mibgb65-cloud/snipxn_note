import api from './axios';

export function runCode(payload) {
  return api.post('/sandbox/run', payload);
}
