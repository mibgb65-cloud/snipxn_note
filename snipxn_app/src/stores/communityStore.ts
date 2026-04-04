import { create } from 'zustand';

import * as commentApi from '../api/comment';
import * as followApi from '../api/follow';
import * as postApi from '../api/post';
import type {
  CommentResponse,
  CreatePostRequest,
  PostDetailResponse,
  PostListItemResponse,
  UserProfileResponse,
} from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export interface CommunityState {
  posts: PostListItemResponse[];
  hotPosts: PostListItemResponse[];
  currentPost: PostDetailResponse | null;
  comments: CommentResponse[];
  recommendedUsers: UserProfileResponse[];
  followingIds: string[];
  loading: boolean;
  fetchPosts: (page?: number) => Promise<void>;
  fetchHotPosts: (page?: number) => Promise<void>;
  fetchPostDetail: (id: string) => Promise<void>;
  createPost: (req: CreatePostRequest) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  collectPost: (id: string) => Promise<void>;
  uncollectPost: (id: string) => Promise<void>;
  fetchComments: (postId: string, page?: number) => Promise<void>;
  fetchReplies: (postId: string, commentId: string, page?: number) => Promise<void>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  unlikeComment: (postId: string, commentId: string) => Promise<void>;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  fetchFollowingIds: () => Promise<void>;
  fetchRecommended: () => Promise<void>;
}

const initialCommunityState = {
  posts: [],
  hotPosts: [],
  currentPost: null,
  comments: [],
  recommendedUsers: [],
  followingIds: [],
  loading: false,
} satisfies Pick<
  CommunityState,
  'posts' | 'hotPosts' | 'currentPost' | 'comments' | 'recommendedUsers' | 'followingIds' | 'loading'
>;

type PostDraft = PostListItemResponse | PostDetailResponse;
type PostUpdater = (post: PostDraft) => PostDraft;
type CommentUpdater = (comment: CommentResponse) => CommentResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readArrayCandidate<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

function extractPaginatedItems<T>(value: unknown): T[] {
  const directArray = readArrayCandidate<T>(value);

  if (directArray) {
    return directArray;
  }

  if (!isRecord(value)) {
    return [];
  }

  const nestedData = isRecord(value.data) ? value.data : null;
  const candidates = [
    value.list,
    value.records,
    value.items,
    value.content,
    nestedData?.list,
    nestedData?.records,
    nestedData?.items,
    nestedData?.content,
  ];

  for (const candidate of candidates) {
    const resolved = readArrayCandidate<T>(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return [];
}

function mergePaginatedPosts(
  existingPosts: PostListItemResponse[],
  incomingPosts: PostListItemResponse[],
  page: number,
): PostListItemResponse[] {
  if (page <= DEFAULT_PAGE) {
    return incomingPosts;
  }

  const mergedPosts = [...existingPosts];
  const existingIds = new Set(existingPosts.map(post => post.id));

  for (const post of incomingPosts) {
    if (existingIds.has(post.id)) {
      continue;
    }

    mergedPosts.push(post);
  }

  return mergedPosts;
}

function mergePaginatedComments(
  existingComments: CommentResponse[],
  incomingComments: CommentResponse[],
  page: number,
): CommentResponse[] {
  if (page <= DEFAULT_PAGE) {
    return incomingComments;
  }

  const mergedComments = [...existingComments];
  const existingIds = new Set(existingComments.map(comment => comment.id));

  for (const comment of incomingComments) {
    if (existingIds.has(comment.id)) {
      continue;
    }

    mergedComments.push(comment);
  }

  return mergedComments;
}

function toListItem(post: PostDetailResponse): PostListItemResponse {
  const { content: _content, originNoteId: _originNoteId, updatedAt: _updatedAt, ...listItem } = post;
  return listItem;
}

function updatePostCollection(
  collection: PostListItemResponse[],
  postId: string,
  updater: PostUpdater,
): PostListItemResponse[] {
  return collection.map(post => (post.id === postId ? (updater(post) as PostListItemResponse) : post));
}

function updateCurrentPost(
  currentPost: PostDetailResponse | null,
  postId: string,
  updater: PostUpdater,
): PostDetailResponse | null {
  if (!currentPost || currentPost.id !== postId) {
    return currentPost;
  }

  return updater(currentPost) as PostDetailResponse;
}

function setPostMutationState(
  set: (partial: Partial<CommunityState>) => void,
  getState: () => CommunityState,
  postId: string,
  updater: PostUpdater,
): void {
  const state = getState();

  set({
    posts: updatePostCollection(state.posts, postId, updater),
    hotPosts: updatePostCollection(state.hotPosts, postId, updater),
    currentPost: updateCurrentPost(state.currentPost, postId, updater),
  });
}

function updateCommentCollection(
  comments: CommentResponse[],
  commentId: string,
  updater: CommentUpdater,
): CommentResponse[] {
  return comments.map(comment => (comment.id === commentId ? updater(comment) : comment));
}

function mergeReplies(
  comments: CommentResponse[],
  parentId: string,
  replies: CommentResponse[],
  page: number,
): CommentResponse[] {
  const nonReplies = comments.filter(comment => comment.parentId !== parentId);
  const existingReplies = page <= DEFAULT_PAGE ? [] : comments.filter(comment => comment.parentId === parentId);
  const mergedReplies = mergePaginatedComments(existingReplies, replies, page);
  const parentIndex = nonReplies.findIndex(comment => comment.id === parentId);

  if (parentIndex === -1) {
    return [...nonReplies, ...mergedReplies];
  }

  return [
    ...nonReplies.slice(0, parentIndex + 1),
    ...mergedReplies,
    ...nonReplies.slice(parentIndex + 1),
  ];
}

function insertCommentAfterParent(
  comments: CommentResponse[],
  comment: CommentResponse,
): CommentResponse[] {
  if (!comment.parentId) {
    return [comment, ...comments.filter(item => item.id !== comment.id)];
  }

  const existing = comments.filter(item => item.id !== comment.id);
  const parentIndex = existing.findIndex(item => item.id === comment.parentId);

  if (parentIndex === -1) {
    return [...existing, comment];
  }

  return [
    ...existing.slice(0, parentIndex + 1),
    comment,
    ...existing.slice(parentIndex + 1),
  ];
}

function updateCommentCount(post: PostDraft, delta: number): PostDraft {
  return {
    ...post,
    commentCount: Math.max(post.commentCount + delta, 0),
  };
}

function setFollowingState(
  set: (partial: Partial<CommunityState>) => void,
  getState: () => CommunityState,
  userId: string,
  isFollowing: boolean,
): void {
  const state = getState();
  const followingIdSet = new Set(state.followingIds);

  if (isFollowing) {
    followingIdSet.add(userId);
  } else {
    followingIdSet.delete(userId);
  }

  set({
    followingIds: [...followingIdSet],
    recommendedUsers: state.recommendedUsers.map(user =>
      user.id === userId
        ? {
            ...user,
            isFollowing,
            followerCount: Math.max(user.followerCount + (isFollowing ? 1 : -1), 0),
          }
        : user,
    ),
  });
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  ...initialCommunityState,
  fetchPosts: async (page = DEFAULT_PAGE) => {
    set({ loading: true });

    try {
      const response = await postApi.listPosts({
        page,
        size: DEFAULT_PAGE_SIZE,
      });
      const posts = extractPaginatedItems<PostListItemResponse>(response);

      set(state => ({
        posts: mergePaginatedPosts(state.posts, posts, page),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchHotPosts: async (page = DEFAULT_PAGE) => {
    set({ loading: true });

    try {
      const response = await postApi.listHotPosts({
        page,
        size: DEFAULT_PAGE_SIZE,
      });
      const hotPosts = extractPaginatedItems<PostListItemResponse>(response);

      set(state => ({
        hotPosts: mergePaginatedPosts(state.hotPosts, hotPosts, page),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchPostDetail: async id => {
    set({ loading: true });

    try {
      const currentPost = await postApi.getPostDetail(id);
      set({ currentPost, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  createPost: async req => {
    set({ loading: true });

    try {
      const createdPost = await postApi.createPost(req);

      set(state => ({
        posts: [toListItem(createdPost), ...state.posts.filter(post => post.id !== createdPost.id)],
        currentPost: createdPost,
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  deletePost: async id => {
    set({ loading: true });

    try {
      await postApi.deletePost(id);

      set(state => ({
        posts: state.posts.filter(post => post.id !== id),
        hotPosts: state.hotPosts.filter(post => post.id !== id),
        currentPost: state.currentPost?.id === id ? null : state.currentPost,
        comments: state.currentPost?.id === id ? [] : state.comments,
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  likePost: async id => {
    const previousState = {
      posts: get().posts,
      hotPosts: get().hotPosts,
      currentPost: get().currentPost,
    };

    setPostMutationState(set, get, id, post => ({
      ...post,
      isLiked: true,
      likeCount: post.isLiked ? post.likeCount : post.likeCount + 1,
    }));

    try {
      await postApi.likePost(id);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  unlikePost: async id => {
    const previousState = {
      posts: get().posts,
      hotPosts: get().hotPosts,
      currentPost: get().currentPost,
    };

    setPostMutationState(set, get, id, post => ({
      ...post,
      isLiked: false,
      likeCount: post.isLiked ? Math.max(post.likeCount - 1, 0) : post.likeCount,
    }));

    try {
      await postApi.unlikePost(id);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  collectPost: async id => {
    const previousState = {
      posts: get().posts,
      hotPosts: get().hotPosts,
      currentPost: get().currentPost,
    };

    setPostMutationState(set, get, id, post => ({
      ...post,
      isCollected: true,
      collectCount: post.isCollected ? post.collectCount : post.collectCount + 1,
    }));

    try {
      await postApi.collectPost(id);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  uncollectPost: async id => {
    const previousState = {
      posts: get().posts,
      hotPosts: get().hotPosts,
      currentPost: get().currentPost,
    };

    setPostMutationState(set, get, id, post => ({
      ...post,
      isCollected: false,
      collectCount: post.isCollected ? Math.max(post.collectCount - 1, 0) : post.collectCount,
    }));

    try {
      await postApi.uncollectPost(id);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  fetchComments: async (postId, page = DEFAULT_PAGE) => {
    set({ loading: true });

    try {
      const response = await commentApi.listComments(postId, {
        page,
        size: DEFAULT_PAGE_SIZE,
      });
      const comments = extractPaginatedItems<CommentResponse>(response);

      set(state => {
        const existingReplies = state.comments.filter(comment => comment.parentId !== null);
        const mergedTopLevel = mergePaginatedComments(
          state.comments.filter(comment => comment.parentId === null),
          comments,
          page,
        );
        return {
          comments: [...mergedTopLevel, ...existingReplies],
          loading: false,
        };
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchReplies: async (postId, commentId, page = DEFAULT_PAGE) => {
    set({ loading: true });

    try {
      const response = await commentApi.listReplies(postId, commentId, {
        page,
        size: DEFAULT_PAGE_SIZE,
      });
      const replies = extractPaginatedItems<CommentResponse>(response);

      set(state => ({
        comments: mergeReplies(state.comments, commentId, replies, page),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  createComment: async (postId, content, parentId) => {
    set({ loading: true });

    try {
      const createdComment = await commentApi.createComment(postId, {
        content,
        parentId,
      });

      set(state => ({
        comments: insertCommentAfterParent(state.comments, createdComment),
        posts: updatePostCollection(state.posts, postId, post => updateCommentCount(post, 1)),
        hotPosts: updatePostCollection(state.hotPosts, postId, post => updateCommentCount(post, 1)),
        currentPost: updateCurrentPost(state.currentPost, postId, post => updateCommentCount(post, 1)),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  deleteComment: async (postId, commentId) => {
    set({ loading: true });

    try {
      await commentApi.deleteComment(postId, commentId);

      set(state => {
        const removedCommentIds = new Set(
          state.comments
            .filter(comment => comment.id === commentId || comment.parentId === commentId)
            .map(comment => comment.id),
        );
        const removedCount = removedCommentIds.size;

        return {
          comments: state.comments.filter(comment => !removedCommentIds.has(comment.id)),
          posts: updatePostCollection(state.posts, postId, post => updateCommentCount(post, -removedCount)),
          hotPosts: updatePostCollection(state.hotPosts, postId, post => updateCommentCount(post, -removedCount)),
          currentPost: updateCurrentPost(state.currentPost, postId, post => updateCommentCount(post, -removedCount)),
          loading: false,
        };
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  likeComment: async (postId, commentId) => {
    const previousComments = get().comments;

    set({
      comments: updateCommentCollection(get().comments, commentId, comment => ({
        ...comment,
        isLiked: true,
        likeCount: comment.isLiked ? comment.likeCount : comment.likeCount + 1,
      })),
    });

    try {
      await commentApi.likeComment(postId, commentId);
    } catch (error) {
      set({ comments: previousComments });
      throw error;
    }
  },
  unlikeComment: async (postId, commentId) => {
    const previousComments = get().comments;

    set({
      comments: updateCommentCollection(get().comments, commentId, comment => ({
        ...comment,
        isLiked: false,
        likeCount: comment.isLiked ? Math.max(comment.likeCount - 1, 0) : comment.likeCount,
      })),
    });

    try {
      await commentApi.unlikeComment(postId, commentId);
    } catch (error) {
      set({ comments: previousComments });
      throw error;
    }
  },
  follow: async userId => {
    const previousState = {
      followingIds: get().followingIds,
      recommendedUsers: get().recommendedUsers,
    };

    setFollowingState(set, get, userId, true);

    try {
      await followApi.follow(userId);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  unfollow: async userId => {
    const previousState = {
      followingIds: get().followingIds,
      recommendedUsers: get().recommendedUsers,
    };

    setFollowingState(set, get, userId, false);

    try {
      await followApi.unfollow(userId);
    } catch (error) {
      set(previousState);
      throw error;
    }
  },
  fetchFollowingIds: async () => {
    set({ loading: true });

    try {
      const followingIds = await followApi.getFollowing();

      set({
        followingIds,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchRecommended: async () => {
    set({ loading: true });

    try {
      const recommendedUsers = await followApi.getRecommended();

      set(state => ({
        recommendedUsers: recommendedUsers.map(user => ({
          ...user,
          isFollowing: state.followingIds.includes(user.id) || user.isFollowing,
        })),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));

export function resetCommunityStore(): void {
  useCommunityStore.setState(initialCommunityState);
}

