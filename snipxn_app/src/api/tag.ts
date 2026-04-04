import type {
  CreateTagRequest,
  TagResponse,
  UpdateTagRequest,
} from '../types';

import { apiClient } from './axios';

const TAGS_BASE_URL = '/tags';

export function listTags(): Promise<TagResponse[]> {
  return apiClient.get<TagResponse[]>(TAGS_BASE_URL);
}

export function createTag(req: CreateTagRequest): Promise<TagResponse> {
  return apiClient.post<TagResponse, CreateTagRequest>(TAGS_BASE_URL, req);
}

export function updateTag(id: string, req: UpdateTagRequest): Promise<TagResponse> {
  return apiClient.put<TagResponse, UpdateTagRequest>(`${TAGS_BASE_URL}/${id}`, req);
}

export function deleteTag(id: string): Promise<void> {
  return apiClient.delete<void>(`${TAGS_BASE_URL}/${id}`);
}
