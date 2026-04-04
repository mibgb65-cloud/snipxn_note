import type { DB, Scalar } from '@op-engineering/op-sqlite';

import { useAuthStore } from '../../stores/authStore';
import type { Folder, Note, PendingDelete, SyncStatus, Tag } from '../../types';
import { toISOString } from '../../utils/time';
import { generateUUID } from '../../utils/uuid';
import { getDatabase } from '../database';

export type SqlExecutor = Pick<DB, 'execute'>;

export const LAST_PULLED_AT_META_KEY = 'last_pulled_at';
export const DEVICE_ID_META_KEY = 'device_id';

interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  is_default: number;
  rank_index: string | null;
  is_deleted: number;
  version: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

interface NoteRow {
  id: string;
  user_id: string;
  folder_id: string;
  title: string;
  content: string;
  summary: string | null;
  primary_language: string | null;
  is_starred: number;
  is_deleted: number;
  status: Note['status'];
  version: number;
  last_device_id: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  is_deleted: number;
  version: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

interface PendingDeleteRow {
  id: string;
  table_name: PendingDelete['tableName'];
  record_id: string;
  version: number;
  created_at: string;
}

interface SyncStatusRow {
  sync_status: SyncStatus;
}

interface TagIdRow {
  tag_id: string;
}

export function toSqliteBoolean(value: boolean): number {
  return value ? 1 : 0;
}

function fromSqliteBoolean(value: number | boolean | string): boolean {
  return value === true || value === 1 || value === '1';
}

export async function getRows<T>(
  executor: SqlExecutor,
  query: string,
  params: Scalar[] = [],
): Promise<T[]> {
  const result = await executor.execute(query, params);
  return result.rows as T[];
}

export async function getFirstRow<T>(
  executor: SqlExecutor,
  query: string,
  params: Scalar[] = [],
): Promise<T | null> {
  const rows = await getRows<T>(executor, query, params);
  return rows[0] ?? null;
}

export function requireCurrentUserId(): string {
  const userId = useAuthStore.getState().user?.id;

  if (!userId) {
    throw new Error('Authenticated user is required for local database operations.');
  }

  return userId;
}

export async function getCurrentSyncStatus(
  tableName: 'folders' | 'notes' | 'tags',
  id: string,
): Promise<SyncStatus | null> {
  const row = await getFirstRow<SyncStatusRow>(
    getDatabase(),
    `SELECT sync_status FROM ${tableName} WHERE id = ? LIMIT 1`,
    [id],
  );

  return row?.sync_status ?? null;
}

export function getNextSyncStatus(
  currentSyncStatus: SyncStatus | null,
  requestedSyncStatus?: SyncStatus,
): SyncStatus {
  if (requestedSyncStatus !== undefined) {
    return requestedSyncStatus;
  }

  if (currentSyncStatus === 'created') {
    return 'created';
  }

  return 'updated';
}

export function buildUpdateStatement(
  fields: Array<[string, Scalar | undefined]>,
): { setClause: string; params: Scalar[] } {
  const definedFields = fields.filter(([, value]) => value !== undefined) as Array<
    [string, Scalar]
  >;

  return {
    setClause: definedFields.map(([column]) => `${column} = ?`).join(', '),
    params: definedFields.map(([, value]) => value),
  };
}

export async function getTagIdsByNoteIdWithExecutor(
  executor: SqlExecutor,
  noteId: string,
): Promise<string[]> {
  const rows = await getRows<TagIdRow>(
    executor,
    'SELECT tag_id FROM note_tags WHERE note_id = ? ORDER BY tag_id ASC',
    [noteId],
  );

  return rows.map(row => row.tag_id);
}

export async function replaceNoteTags(
  executor: SqlExecutor,
  noteId: string,
  tagIds: string[],
): Promise<void> {
  await executor.execute('DELETE FROM note_tags WHERE note_id = ?', [noteId]);

  const uniqueTagIds = [...new Set(tagIds)];

  for (const tagId of uniqueTagIds) {
    await executor.execute(
      'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
      [noteId, tagId],
    );
  }
}

export async function insertPendingDeleteRecord(
  executor: SqlExecutor,
  tableName: PendingDelete['tableName'],
  recordId: string,
  version: number,
): Promise<void> {
  await executor.execute(
    'DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?',
    [tableName, recordId],
  );
  await executor.execute(
    `
    INSERT INTO pending_deletes (id, table_name, record_id, version, created_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [generateUUID(), tableName, recordId, version, toISOString()],
  );
}

export async function clearPendingDeleteRecord(
  executor: SqlExecutor,
  tableName: PendingDelete['tableName'],
  recordId: string,
): Promise<void> {
  await executor.execute(
    'DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?',
    [tableName, recordId],
  );
}

export function mapFolderRow(row: FolderRow): Folder {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    isDefault: fromSqliteBoolean(row.is_default),
    rankIndex: row.rank_index,
    isDeleted: fromSqliteBoolean(row.is_deleted),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

export function mapNoteRow(row: NoteRow, tagIds: string[]): Note {
  return {
    id: row.id,
    userId: row.user_id,
    folderId: row.folder_id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    primaryLanguage: row.primary_language,
    isStarred: fromSqliteBoolean(row.is_starred),
    isDeleted: fromSqliteBoolean(row.is_deleted),
    status: row.status,
    version: row.version,
    lastDeviceId: row.last_device_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    tagIds,
  };
}

export function mapTagRow(row: TagRow): Tag {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    isDeleted: fromSqliteBoolean(row.is_deleted),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

export function mapPendingDeleteRow(row: PendingDeleteRow): PendingDelete {
  return {
    id: row.id,
    tableName: row.table_name,
    recordId: row.record_id,
    version: row.version,
    createdAt: row.created_at,
  };
}

