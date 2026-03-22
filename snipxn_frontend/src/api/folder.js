import api from './axios';

export function getFolders() {
  return api.get('/folders');
}

export function createFolder(payload) {
  return api.post('/folders', payload);
}

export function updateFolder(folderId, payload) {
  return api.put(`/folders/${folderId}`, payload);
}

export function deleteFolder(folderId) {
  return api.delete(`/folders/${folderId}`);
}
