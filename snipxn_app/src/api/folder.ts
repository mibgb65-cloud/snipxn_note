import type { CreateFolderRequest, FolderResponse, UpdateFolderRequest } from '../types';

import { apiClient } from './axios';

const FOLDERS_BASE_URL = '/folders';

export function listFolders(): Promise<FolderResponse[]> {
  return apiClient.get<FolderResponse[]>(FOLDERS_BASE_URL);
}

export function createFolder(req: CreateFolderRequest): Promise<FolderResponse> {
  return apiClient.post<FolderResponse, CreateFolderRequest>(FOLDERS_BASE_URL, req);
}

export function updateFolder(
  id: string,
  req: UpdateFolderRequest,
): Promise<FolderResponse> {
  return apiClient.put<FolderResponse, UpdateFolderRequest>(
    `${FOLDERS_BASE_URL}/${id}`,
    req,
  );
}

export function deleteFolder(id: string): Promise<void> {
  return apiClient.delete<void>(`${FOLDERS_BASE_URL}/${id}`);
}
