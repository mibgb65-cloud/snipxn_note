import api from './axios';

export const listTags = () => api.get('/tags');
export const createTag = (data) => api.post('/tags', data);
export const updateTag = (tagId, data) => api.put(`/tags/${tagId}`, data);
export const deleteTag = (tagId) => api.delete(`/tags/${tagId}`);
