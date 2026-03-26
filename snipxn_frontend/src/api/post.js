import axios from 'axios';
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

// 分享帖子（生成公开链接）
export function sharePost(postId) {
  return api.post(`/posts/${postId}/share`);
}

// 查看帖子分享状态
export function checkPostShare(postId) {
  return api.get(`/posts/${postId}/share`);
}

// 取消帖子分享
export function cancelPostShare(postId) {
  return api.delete(`/posts/${postId}/share`);
}

// 获取公开帖子（无需登录）
export function getPublicPost(shareToken) {
  return axios.get(`/api/v1/public/posts/${shareToken}`).then(res => {
    const result = res.data;
    if (result.code === 200 || result.code === 0) return result;
    return Promise.reject(new Error(result.message || 'Request failed'));
  });
}

// 热榜帖子
export function listHotPosts(params = {}) {
  return api.get('/posts/hot', { params });
}
