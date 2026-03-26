import axios from 'axios';
import api from './axios';

export function listNotes(params = {}) {
  return api.get('/notes', { params });
}

export function listStarredNotes(params = {}) {
  return api.get('/notes/starred', { params });
}

export function listTrashNotes(params = {}) {
  return api.get('/notes/trash', { params });
}

export function getNote(noteId) {
  return api.get(`/notes/${noteId}`);
}

export function createNote(payload) {
  return api.post('/notes', payload);
}

export function updateNote(noteId, payload) {
  return api.put(`/notes/${noteId}`, payload);
}

export function deleteNote(noteId) {
  return api.delete(`/notes/${noteId}`);
}

export function restoreNote(noteId) {
  return api.post(`/notes/${noteId}/restore`);
}

export function deleteNotePermanently(noteId) {
  return api.delete(`/notes/${noteId}/permanent`);
}

export function checkShare(noteId) {
  return api.get(`/notes/${noteId}/share`);
}

export function shareNote(noteId) {
  return api.post(`/notes/${noteId}/share`);
}

export function cancelShare(noteId) {
  return api.delete(`/notes/${noteId}/share`);
}

export function getPublicNote(shareToken) {
  return axios.get(`/api/v1/public/notes/${shareToken}`).then(res => {
    const result = res.data;
    if (result.code === 200 || result.code === 0) return result;
    return Promise.reject(new Error(result.message || 'Request failed'));
  });
}

export function importNotes(files, folderId) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (folderId) formData.append('folderId', folderId);
  return api.post('/notes/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
