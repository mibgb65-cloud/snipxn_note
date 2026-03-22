import api from './axios';

// 公共 Feed 流（分页）
export function listPosts(params = {}) {
  return api.get('/posts', { params });
}

// 某用户的帖子列表
export function listUserPosts(userId, params = {}) {
  return api.get(`/posts/user/${userId}`, { params });
}

// 帖子详情
export function getPost(postId) {
  return api.get(`/posts/${postId}`);
}

// 发布帖子
export function createPost(payload) {
  return api.post('/posts', payload);
}

// 删除帖子
export function deletePost(postId) {
  return api.delete(`/posts/${postId}`);
}

// 点赞
export function likePost(postId) {
  return api.post(`/posts/${postId}/like`);
}

// 取消点赞
export function unlikePost(postId) {
  return api.delete(`/posts/${postId}/like`);
}

// 收藏
export function collectPost(postId) {
  return api.post(`/posts/${postId}/collect`);
}

// 取消收藏
export function uncollectPost(postId) {
  return api.delete(`/posts/${postId}/collect`);
}
