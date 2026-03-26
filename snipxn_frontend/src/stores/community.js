import { defineStore } from 'pinia';
import * as postApi from '../api/post';
import * as followApi from '../api/follow';
import * as commentApi from '../api/comment';
import { getUserProfile } from '../api/user';

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

    // 评论
    comments: [],
    commentTotal: 0,
    commentPage: 1,
    loadingComments: false,

    // 热榜
    hotPosts: [],
    loadingHot: false,

    // 推荐用户
    recommendedUsers: [],
    loadingRecommended: false,

    // 用户主页
    userProfile: null,
    loadingProfile: false,
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

    // ── 分享 ──
    async sharePost(postId) {
      const res = await postApi.sharePost(postId);
      if (this.currentPost && String(this.currentPost.id) === String(postId)) {
        this.currentPost.shareCount = (this.currentPost.shareCount || 0) + 1;
      }
      return res.data?.shareToken || null;
    },

    async checkPostShare(postId) {
      const res = await postApi.checkPostShare(postId);
      return res.data?.shareToken || null;
    },

    async cancelPostShare(postId) {
      await postApi.cancelPostShare(postId);
    },

    // ── 评论 ──
    async fetchComments(postId, options = {}) {
      const page = options.page ?? 1;
      const size = options.size ?? 20;
      this.loadingComments = true;

      try {
        const res = await commentApi.listComments(postId, { page, size });
        const data = res.data || {};
        this.comments = data.records || [];
        this.commentTotal = data.total ?? 0;
        this.commentPage = data.page ?? page;
        return res;
      } finally {
        this.loadingComments = false;
      }
    },

    async fetchReplies(postId, commentId, options = {}) {
      const page = options.page ?? 1;
      const size = options.size ?? 20;
      const res = await commentApi.listReplies(postId, commentId, { page, size });
      return res.data || {};
    },

    async createComment(postId, payload, options = {}) {
      const res = await commentApi.createComment(postId, payload);
      const refreshPage = options.page ?? (payload?.parentId ? this.commentPage : 1);
      await this.fetchComments(postId, { page: refreshPage });
      if (this.currentPost && String(this.currentPost.id) === String(postId)) {
        this.currentPost.commentCount = (this.currentPost.commentCount || 0) + 1;
      }
      return res.data;
    },

    async deleteComment(postId, commentId) {
      await commentApi.deleteComment(postId, commentId);
      await this.fetchComments(postId, { page: this.commentPage });
      if (this.currentPost && String(this.currentPost.id) === String(postId)) {
        this.currentPost.commentCount = Math.max(0, (this.currentPost.commentCount || 0) - 1);
      }
    },

    async likeComment(postId, commentId) {
      await commentApi.likeComment(postId, commentId);
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.liked = true;
        comment.likeCount = (comment.likeCount || 0) + 1;
      }
    },

    async unlikeComment(postId, commentId) {
      await commentApi.unlikeComment(postId, commentId);
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.liked = false;
        comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
      }
    },

    // ── 热榜 ──
    async fetchHotPosts(options = {}) {
      const page = options.page ?? 1;
      const size = options.size ?? 20;
      this.loadingHot = true;

      try {
        const res = await postApi.listHotPosts({ page, size });
        const data = res.data || {};
        this.hotPosts = data.records || [];
        return res;
      } finally {
        this.loadingHot = false;
      }
    },

    // ── 用户主页 ──
    async fetchUserProfile(userId) {
      this.loadingProfile = true;
      try {
        const res = await getUserProfile(userId);
        this.userProfile = res.data || null;
        return this.userProfile;
      } finally {
        this.loadingProfile = false;
      }
    },

    // ── 推荐用户 ──
    async fetchRecommendedUsers(limit = 5) {
      this.loadingRecommended = true;

      try {
        const res = await followApi.getRecommendedUsers(limit);
        this.recommendedUsers = res.data || [];
        return res;
      } finally {
        this.loadingRecommended = false;
      }
    },
  },
});
