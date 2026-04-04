import type { SyncPullResponse, Tag, TagResponse } from '../../types';
import { toISOString } from '../../utils/time';
import { getDatabase } from '../database';

import {
  buildUpdateStatement,
  getCurrentSyncStatus,
  getFirstRow,
  getNextSyncStatus,
  getRows,
  insertPendingDeleteRecord,
  mapTagRow,
  requireCurrentUserId,
  toSqliteBoolean,
} from './internal';

type SyncTagPayload = SyncPullResponse['tags'][number];

export async function getAll(userId: string): Promise<Tag[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM tags
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY name COLLATE NOCASE ASC
    `,
    [userId],
  );

  return rows.map(mapTagRow);
}

export async function getById(id: string): Promise<Tag | null> {
  const row = await getFirstRow<any>(
    getDatabase(),
    'SELECT * FROM tags WHERE id = ? LIMIT 1',
    [id],
  );

  return row ? mapTagRow(row) : null;
}

export async function insert(tag: Tag): Promise<void> {
  await getDatabase().execute(
    `
    INSERT INTO tags (
      id, user_id, name, color, is_deleted,
      version, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tag.id,
      tag.userId,
      tag.name,
      tag.color,
      toSqliteBoolean(tag.isDeleted),
      tag.version,
      tag.createdAt,
      tag.updatedAt,
      tag.syncStatus,
    ],
  );
}

export async function update(tag: Partial<Tag> & { id: string }): Promise<void> {
  const currentSyncStatus = await getCurrentSyncStatus('tags', tag.id);
  const updatedAt = tag.updatedAt ?? toISOString();
  const syncStatus = getNextSyncStatus(currentSyncStatus, tag.syncStatus);
  const { setClause, params } = buildUpdateStatement([
    ['user_id', tag.userId],
    ['name', tag.name],
    ['color', tag.color],
    ['is_deleted', tag.isDeleted === undefined ? undefined : toSqliteBoolean(tag.isDeleted)],
    ['version', tag.version],
    ['created_at', tag.createdAt],
    ['updated_at', updatedAt],
    ['sync_status', syncStatus],
  ]);

  await getDatabase().execute(`UPDATE tags SET ${setClause} WHERE id = ?`, [
    ...params,
    tag.id,
  ]);
}

export async function markDeleted(id: string, version: number): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE tags
      SET is_deleted = 1,
          version = ?,
          updated_at = ?,
          sync_status = 'deleted'
      WHERE id = ?
      `,
      [version, now, id],
    );
    await insertPendingDeleteRecord(tx, 'tags', id, version);
  });
}

export async function getDirty(): Promise<Tag[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM tags
    WHERE sync_status != 'synced'
    ORDER BY updated_at DESC
    `,
  );

  return rows.map(mapTagRow);
}

export async function upsertFromServer(tag: TagResponse | SyncTagPayload): Promise<void> {
  const userId = requireCurrentUserId();
  const createdAt = 'createdAt' in tag ? tag.createdAt : tag.updatedAt;

  await getDatabase().execute(
    `
    INSERT OR REPLACE INTO tags (
      id, user_id, name, color, is_deleted,
      version, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tag.id,
      userId,
      tag.name,
      tag.color,
      0,
      tag.version,
      createdAt,
      tag.updatedAt,
      'synced',
    ],
  );
}

export async function resetSyncStatus(): Promise<void> {
  await getDatabase().execute(
    `
    UPDATE tags
    SET sync_status = 'synced'
    WHERE sync_status != 'synced'
    `,
  );
}
