import api from './axios';

// 顶级评论列表
export function listComments(postId, params = {}) {
  return api.get(`/posts/${postId}/comments`, { params });
}

// 回复列表
export function listReplies(postId, commentId, params = {}) {
  return api.get(`/posts/${postId}/comments/${commentId}/replies`, { params });
}

// 发评论
export function createComment(postId, payload) {
  return api.post(`/posts/${postId}/comments`, payload);
}

// 删评论
export function deleteComment(postId, commentId) {
  return api.delete(`/posts/${postId}/comments/${commentId}`);
}

// 点赞评论
export function likeComment(postId, commentId) {
  return api.post(`/posts/${postId}/comments/${commentId}/like`);
}

// 取消点赞评论
export function unlikeComment(postId, commentId) {
  return api.delete(`/posts/${postId}/comments/${commentId}/like`);
}
