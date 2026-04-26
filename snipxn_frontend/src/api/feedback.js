import api from './axios';

export function submitFeedback(payload) {
  return api.post('/feedbacks', payload);
}
