import type {
  CreatePostRequest,
  PageResult,
  PostDetailResponse,
  PostListItemResponse,
  PostListParams,
  ShareResponse,
  ShareStatusResponse,
} from '../types';

import { apiClient } from './axios';

const POSTS_BASE_URL = '/posts';

export function listPosts(
  params: PostListParams = {},
): Promise<PageResult<PostListItemResponse>> {
  return apiClient.get<PageResult<PostListItemResponse>>(POSTS_BASE_URL, {
    params,
  });
}

export function listUserPosts(
  userId: string,
  params: PostListParams = {},
): Promise<PageResult<PostListItemResponse>> {
  return apiClient.get<PageResult<PostListItemResponse>>(
    `${POSTS_BASE_URL}/user/${userId}`,
    {
      params,
    },
  );
}

export function listHotPosts(
  params: PostListParams = {},
): Promise<PageResult<PostListItemResponse>> {
  return apiClient.get<PageResult<PostListItemResponse>>(
    `${POSTS_BASE_URL}/hot`,
    {
      params,
    },
  );
}

export function getPostDetail(id: string): Promise<PostDetailResponse> {
  return apiClient.get<PostDetailResponse>(`${POSTS_BASE_URL}/${id}`);
}

export function createPost(req: CreatePostRequest): Promise<PostDetailResponse> {
  return apiClient.post<PostDetailResponse, CreatePostRequest>(POSTS_BASE_URL, req);
}

export function deletePost(id: string): Promise<void> {
  return apiClient.delete<void>(`${POSTS_BASE_URL}/${id}`);
}

export function likePost(id: string): Promise<void> {
  return apiClient.post<void>(`${POSTS_BASE_URL}/${id}/like`);
}

export function unlikePost(id: string): Promise<void> {
  return apiClient.delete<void>(`${POSTS_BASE_URL}/${id}/like`);
}

export function collectPost(id: string): Promise<void> {
  return apiClient.post<void>(`${POSTS_BASE_URL}/${id}/collect`);
}

export function uncollectPost(id: string): Promise<void> {
  return apiClient.delete<void>(`${POSTS_BASE_URL}/${id}/collect`);
}

export function sharePost(id: string): Promise<ShareResponse> {
  return apiClient.post<ShareResponse>(`${POSTS_BASE_URL}/${id}/share`);
}

export function getShareStatus(id: string): Promise<ShareStatusResponse> {
  return apiClient.get<ShareStatusResponse>(`${POSTS_BASE_URL}/${id}/share`);
}

export function cancelShare(id: string): Promise<void> {
  return apiClient.delete<void>(`${POSTS_BASE_URL}/${id}/share`);
}
