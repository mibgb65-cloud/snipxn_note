import { defineStore } from 'pinia';
import * as postApi from '../api/post';
import * as followApi from '../api/follow';

export const useCommunityStore = defineStore('community', {
  state: () => ({
    // 帖子列表
    posts: [],
    currentPost: null,
    loadingList: false,
    loadingDetail: false,
    page: 1,
    size: 20,
    total: 0,

    // 关注
    followingIds: [],
    followStats: null,
  }),

  getters: {
    // 判断当前用户是否关注了某个 userId
    isFollowing: (state) => (userId) => state.followingIds.includes(userId),
  },

  actions: {
    // ── 帖子列表 ──
    async fetchPosts(options = {}) {
      const page = options.page ?? this.page;
      const size = options.size ?? this.size;
      this.loadingList = true;

      try {
        const res = await postApi.listPosts({ page, size });
        const data = res.data || {};
        this.posts = data.records || [];
        this.total = data.total ?? 0;
        this.page = data.page ?? page;
        this.size = data.size ?? size;
        return res;
      } finally {
        this.loadingList = false;
      }
    },

    // 某用户帖子
    async fetchUserPosts(userId, options = {}) {
      const page = options.page ?? 1;
      const size = options.size ?? this.size;
      this.loadingList = true;

      try {
        const res = await postApi.listUserPosts(userId, { page, size });
        const data = res.data || {};
        this.posts = data.records || [];
        this.total = data.total ?? 0;
        this.page = data.page ?? page;
        return res;
      } finally {
        this.loadingList = false;
      }
    },

    // ── 帖子详情 ──
    async fetchPost(postId) {
      this.loadingDetail = true;

      try {
        const res = await postApi.getPost(postId);
        this.currentPost = res.data || null;
        return this.currentPost;
      } finally {
        this.loadingDetail = false;
      }
    },

    // ── 发布帖子 ──
    async createPost(payload) {
      const res = await postApi.createPost(payload);
      await this.fetchPosts({ page: 1 });
      return res;
    },

    // ── 删除帖子 ──
    async deletePost(postId) {
      await postApi.deletePost(postId);
      this.currentPost = null;
      await this.fetchPosts({ page: this.page });
    },

    // ── 点赞/取消点赞 ──
    async toggleLike(postId) {
      if (!this.currentPost) {
        return;
      }

      const wasLiked = this.currentPost.liked;
      const prevCount = this.currentPost.likeCount || 0;

      this.currentPost.liked = !wasLiked;
      this.currentPost.likeCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

      try {
        if (wasLiked) {
          await postApi.unlikePost(postId);
        } else {
          await postApi.likePost(postId);
        }
      } catch (error) {
        this.currentPost.liked = wasLiked;
        this.currentPost.likeCount = prevCount;
        throw error;
      }
    },

    // ── 收藏/取消收藏 ──
    async toggleCollect(postId) {
      if (!this.currentPost) {
        return;
      }

      const wasCollected = this.currentPost.collected;
      const prevCount = this.currentPost.collectCount || 0;

      this.currentPost.collected = !wasCollected;
      this.currentPost.collectCount = wasCollected ? Math.max(0, prevCount - 1) : prevCount + 1;

      try {
        if (wasCollected) {
          await postApi.uncollectPost(postId);
        } else {
          await postApi.collectPost(postId);
        }
      } catch (error) {
        this.currentPost.collected = wasCollected;
        this.currentPost.collectCount = prevCount;
        throw error;
      }
    },

    // ── 关注 ──
    async fetchFollowing() {
      const res = await followApi.getFollowing();
      this.followingIds = res.data || [];
    },

    async fetchFollowStats() {
      const res = await followApi.getFollowStats();
      this.followStats = res.data || null;
    },

    async toggleFollow(userId) {
      if (this.isFollowing(userId)) {
        await followApi.unfollowUser(userId);
        this.followingIds = this.followingIds.filter((id) => id !== userId);
      } else {
        await followApi.followUser(userId);
        this.followingIds.push(userId);
      }
    },
  },
});
