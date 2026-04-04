import type {
  CommentListParams,
  CommentResponse,
  CreateCommentRequest,
  PageResult,
} from '../types';

import { apiClient } from './axios';

export function listComments(
  postId: string,
  params: CommentListParams = {},
): Promise<PageResult<CommentResponse>> {
  return apiClient.get<PageResult<CommentResponse>>(`/posts/${postId}/comments`, {
    params,
  });
}

export function listReplies(
  postId: string,
  commentId: string,
  params: CommentListParams = {},
): Promise<PageResult<CommentResponse>> {
  return apiClient.get<PageResult<CommentResponse>>(
    `/posts/${postId}/comments/${commentId}/replies`,
    {
      params,
    },
  );
}

export function createComment(
  postId: string,
  req: CreateCommentRequest,
): Promise<CommentResponse> {
  return apiClient.post<CommentResponse, CreateCommentRequest>(
    `/posts/${postId}/comments`,
    req,
  );
}

export function deleteComment(postId: string, commentId: string): Promise<void> {
  return apiClient.delete<void>(`/posts/${postId}/comments/${commentId}`);
}

export function likeComment(postId: string, commentId: string): Promise<void> {
  return apiClient.post<void>(`/posts/${postId}/comments/${commentId}/like`);
}

export function unlikeComment(postId: string, commentId: string): Promise<void> {
  return apiClient.delete<void>(`/posts/${postId}/comments/${commentId}/like`);
}
