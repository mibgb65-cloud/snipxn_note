import api from './axios';

export function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
