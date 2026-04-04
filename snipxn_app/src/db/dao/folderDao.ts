import type { Folder, FolderResponse } from '../../types';
import { toISOString } from '../../utils/time';
import { getDatabase } from '../database';

import {
  buildUpdateStatement,
  getCurrentSyncStatus,
  getFirstRow,
  getNextSyncStatus,
  getRows,
  insertPendingDeleteRecord,
  mapFolderRow,
  requireCurrentUserId,
  toSqliteBoolean,
} from './internal';

export async function getAll(userId: string) {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM folders
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY rank_index IS NULL, rank_index ASC
    `,
    [userId],
  );

  return rows.map(mapFolderRow);
}

export async function getById(id: string) {
  const row = await getFirstRow<any>(
    getDatabase(),
    'SELECT * FROM folders WHERE id = ? LIMIT 1',
    [id],
  );

  return row ? mapFolderRow(row) : null;
}

export async function getDefault(userId: string) {
  const row = await getFirstRow<any>(
    getDatabase(),
    `
    SELECT *
    FROM folders
    WHERE user_id = ? AND is_default = 1
    LIMIT 1
    `,
    [userId],
  );

  if (!row) {
    throw new Error('Default folder not found.');
  }

  return mapFolderRow(row);
}

export async function insert(folder: Folder): Promise<void> {
  await getDatabase().execute(
    `
    INSERT INTO folders (
      id, user_id, name, icon, is_default, rank_index,
      is_deleted, version, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      folder.id,
      folder.userId,
      folder.name,
      folder.icon,
      toSqliteBoolean(folder.isDefault),
      folder.rankIndex,
      toSqliteBoolean(folder.isDeleted),
      folder.version,
      folder.createdAt,
      folder.updatedAt,
      folder.syncStatus,
    ],
  );
}

export async function update(folder: Partial<Folder> & { id: string }): Promise<void> {
  const currentSyncStatus = await getCurrentSyncStatus('folders', folder.id);
  const updatedAt = folder.updatedAt ?? toISOString();
  const syncStatus = getNextSyncStatus(currentSyncStatus, folder.syncStatus);
  const { setClause, params } = buildUpdateStatement([
    ['user_id', folder.userId],
    ['name', folder.name],
    ['icon', folder.icon],
    ['is_default', folder.isDefault === undefined ? undefined : toSqliteBoolean(folder.isDefault)],
    ['rank_index', folder.rankIndex],
    ['is_deleted', folder.isDeleted === undefined ? undefined : toSqliteBoolean(folder.isDeleted)],
    ['version', folder.version],
    ['created_at', folder.createdAt],
    ['updated_at', updatedAt],
    ['sync_status', syncStatus],
  ]);

  await getDatabase().execute(`UPDATE folders SET ${setClause} WHERE id = ?`, [
    ...params,
    folder.id,
  ]);
}

export async function markDeleted(id: string, version: number): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE folders
      SET is_deleted = 1,
          version = ?,
          updated_at = ?,
          sync_status = 'deleted'
      WHERE id = ?
      `,
      [version, now, id],
    );
    await insertPendingDeleteRecord(tx, 'folders', id, version);
  });
}

export async function getDirty() {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM folders
    WHERE sync_status != 'synced'
    ORDER BY updated_at DESC
    `,
  );

  return rows.map(mapFolderRow);
}

export async function upsertFromServer(folder: FolderResponse): Promise<void> {
  await getDatabase().execute(
    `
    INSERT OR REPLACE INTO folders (
      id, user_id, name, icon, is_default, rank_index,
      is_deleted, version, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      folder.id,
      requireCurrentUserId(),
      folder.name,
      folder.icon,
      toSqliteBoolean(folder.isDefault),
      folder.rankIndex,
      0,
      folder.version,
      folder.createdAt,
      folder.updatedAt,
      'synced',
    ],
  );
}

export async function resetSyncStatus(): Promise<void> {
  await getDatabase().execute(
    `
    UPDATE folders
    SET sync_status = 'synced'
    WHERE sync_status != 'synced'
    `,
  );
}
