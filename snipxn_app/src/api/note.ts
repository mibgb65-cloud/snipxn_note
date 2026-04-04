import type {
  CreateNoteRequest,
  ImportNotesResponse,
  NoteDetailResponse,
  NoteListItemResponse,
  NoteListParams,
  PageResult,
  ShareResponse,
  ShareStatusResponse,
  StorageBreakdownResponse,
  UpdateNoteRequest,
} from '../types';

import { apiClient } from './axios';

const NOTES_BASE_URL = '/notes';

export function listNotes(
  params: NoteListParams = {},
): Promise<PageResult<NoteListItemResponse>> {
  return apiClient.get<PageResult<NoteListItemResponse>>(NOTES_BASE_URL, {
    params,
  });
}

export function listStarred(
  params: Omit<NoteListParams, 'folderId'> = {},
): Promise<PageResult<NoteListItemResponse>> {
  return apiClient.get<PageResult<NoteListItemResponse>>(
    `${NOTES_BASE_URL}/starred`,
    {
      params,
    },
  );
}

export function listTrash(
  params: Omit<NoteListParams, 'folderId'> = {},
): Promise<PageResult<NoteListItemResponse>> {
  return apiClient.get<PageResult<NoteListItemResponse>>(
    `${NOTES_BASE_URL}/trash`,
    {
      params,
    },
  );
}

export function getNoteDetail(id: string): Promise<NoteDetailResponse> {
  return apiClient.get<NoteDetailResponse>(`${NOTES_BASE_URL}/${id}`);
}

export function createNote(req: CreateNoteRequest): Promise<NoteDetailResponse> {
  return apiClient.post<NoteDetailResponse, CreateNoteRequest>(NOTES_BASE_URL, req);
}

export function updateNote(
  id: string,
  req: UpdateNoteRequest,
): Promise<NoteDetailResponse> {
  return apiClient.put<NoteDetailResponse, UpdateNoteRequest>(
    `${NOTES_BASE_URL}/${id}`,
    req,
  );
}

export function deleteNote(id: string): Promise<void> {
  return apiClient.delete<void>(`${NOTES_BASE_URL}/${id}`);
}

export function restoreNote(id: string): Promise<void> {
  return apiClient.post<void>(`${NOTES_BASE_URL}/${id}/restore`);
}

export function permanentDelete(id: string): Promise<void> {
  return apiClient.delete<void>(`${NOTES_BASE_URL}/${id}/permanent`);
}

export function getShareStatus(id: string): Promise<ShareStatusResponse> {
  return apiClient.get<ShareStatusResponse>(`${NOTES_BASE_URL}/${id}/share`);
}

export function shareNote(id: string): Promise<ShareResponse> {
  return apiClient.post<ShareResponse>(`${NOTES_BASE_URL}/${id}/share`);
}

export function cancelShare(id: string): Promise<void> {
  return apiClient.delete<void>(`${NOTES_BASE_URL}/${id}/share`);
}

export function getStorageBreakdown(): Promise<StorageBreakdownResponse> {
  return apiClient.get<StorageBreakdownResponse>(`${NOTES_BASE_URL}/storage-breakdown`);
}

export function importNotes(file: FormData): Promise<ImportNotesResponse> {
  return apiClient.post<ImportNotesResponse, FormData>(
    `${NOTES_BASE_URL}/import`,
    file,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}
