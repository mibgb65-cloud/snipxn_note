import api from './axios';

// 关注某用户
export function followUser(userId) {
  return api.post(`/follow/${userId}`);
}

// 取消关注
export function unfollowUser(userId) {
  return api.delete(`/follow/${userId}`);
}

// 我关注的人列表
export function getFollowing() {
  return api.get('/follow/following');
}

// 我的粉丝列表
export function getFollowers() {
  return api.get('/follow/followers');
}

// 关注/粉丝数统计
export function getFollowStats() {
  return api.get('/follow/stats');
}
