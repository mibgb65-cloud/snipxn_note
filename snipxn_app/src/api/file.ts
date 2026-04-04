import type { UploadResponse } from '../types';

import { API_BASE_URL, apiClient } from './axios';

const FILES_BASE_URL = '/files';

export function uploadFile(file: FormData): Promise<UploadResponse> {
  return apiClient.post<UploadResponse, FormData>(FILES_BASE_URL, file, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function getFileUrl(fileId: string): string {
  return `${API_BASE_URL}${FILES_BASE_URL}/${encodeURIComponent(fileId)}`;
}
