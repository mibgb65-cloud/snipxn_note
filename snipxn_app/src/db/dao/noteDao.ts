import type { Note, NoteDetailResponse } from '../../types';
import { toISOString } from '../../utils/time';
import { getDatabase } from '../database';

import {
  buildUpdateStatement,
  clearPendingDeleteRecord,
  getCurrentSyncStatus,
  getFirstRow,
  getNextSyncStatus,
  getRows,
  getTagIdsByNoteIdWithExecutor,
  insertPendingDeleteRecord,
  mapNoteRow,
  replaceNoteTags,
  requireCurrentUserId,
  toSqliteBoolean,
} from './internal';

async function hydrateNote(row: any): Promise<Note> {
  const db = getDatabase();
  const tagIds = await getTagIdsByNoteIdWithExecutor(db, row.id);
  return mapNoteRow(row, tagIds);
}

async function hydrateNotes(rows: any[]): Promise<Note[]> {
  return Promise.all(rows.map(hydrateNote));
}

export async function getAllForUser(userId: string): Promise<Note[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY updated_at DESC
    `,
    [userId],
  );

  return hydrateNotes(rows);
}

export async function getByFolder(folderId: string, page: number, size: number): Promise<Note[]> {
  const offset = Math.max(page - 1, 0) * size;
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE folder_id = ? AND is_deleted = 0
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
    `,
    [folderId, size, offset],
  );

  return hydrateNotes(rows);
}

export async function getStarred(userId: string): Promise<Note[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE user_id = ? AND is_starred = 1 AND is_deleted = 0
    ORDER BY updated_at DESC
    `,
    [userId],
  );

  return hydrateNotes(rows);
}

export async function getTrash(userId: string): Promise<Note[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE user_id = ? AND is_deleted = 1
    ORDER BY updated_at DESC
    `,
    [userId],
  );

  return hydrateNotes(rows);
}

export async function getById(id: string): Promise<Note | null> {
  const row = await getFirstRow<any>(
    getDatabase(),
    'SELECT * FROM notes WHERE id = ? LIMIT 1',
    [id],
  );

  return row ? hydrateNote(row) : null;
}

export async function search(userId: string, query: string): Promise<Note[]> {
  const keyword = `%${query}%`;
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE user_id = ?
      AND is_deleted = 0
      AND (title LIKE ? OR content LIKE ?)
    ORDER BY updated_at DESC
    `,
    [userId, keyword, keyword],
  );

  return hydrateNotes(rows);
}

export async function insert(note: Note): Promise<void> {
  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      INSERT INTO notes (
        id, user_id, folder_id, title, content, summary, primary_language,
        is_starred, is_deleted, status, version, last_device_id,
        created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        note.id,
        note.userId,
        note.folderId,
        note.title,
        note.content,
        note.summary,
        note.primaryLanguage,
        toSqliteBoolean(note.isStarred),
        toSqliteBoolean(note.isDeleted),
        note.status,
        note.version,
        note.lastDeviceId,
        note.createdAt,
        note.updatedAt,
        note.syncStatus,
      ],
    );
    await replaceNoteTags(tx, note.id, note.tagIds);
  });
}

export async function update(note: Partial<Note> & { id: string }): Promise<void> {
  const currentSyncStatus = await getCurrentSyncStatus('notes', note.id);
  const updatedAt = note.updatedAt ?? toISOString();
  const syncStatus = getNextSyncStatus(currentSyncStatus, note.syncStatus);
  const { setClause, params } = buildUpdateStatement([
    ['user_id', note.userId],
    ['folder_id', note.folderId],
    ['title', note.title],
    ['content', note.content],
    ['summary', note.summary],
    ['primary_language', note.primaryLanguage],
    ['is_starred', note.isStarred === undefined ? undefined : toSqliteBoolean(note.isStarred)],
    ['is_deleted', note.isDeleted === undefined ? undefined : toSqliteBoolean(note.isDeleted)],
    ['status', note.status],
    ['version', note.version],
    ['last_device_id', note.lastDeviceId],
    ['created_at', note.createdAt],
    ['updated_at', updatedAt],
    ['sync_status', syncStatus],
  ]);

  await getDatabase().transaction(async tx => {
    await tx.execute(`UPDATE notes SET ${setClause} WHERE id = ?`, [...params, note.id]);

    if (note.tagIds !== undefined) {
      await replaceNoteTags(tx, note.id, note.tagIds);
    }
  });
}

export async function markDeleted(id: string, version: number): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE notes
      SET is_deleted = 1,
          version = ?,
          updated_at = ?,
          sync_status = 'deleted'
      WHERE id = ?
      `,
      [version, now, id],
    );
    await insertPendingDeleteRecord(tx, 'notes', id, version);
  });
}

export async function restore(id: string): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE notes
      SET is_deleted = 0,
          updated_at = ?,
          sync_status = 'updated'
      WHERE id = ?
      `,
      [now, id],
    );
    await clearPendingDeleteRecord(tx, 'notes', id);
  });
}

export async function permanentDelete(id: string): Promise<void> {
  await getDatabase().transaction(async tx => {
    await tx.execute('DELETE FROM note_tags WHERE note_id = ?', [id]);
    await tx.execute('DELETE FROM notes WHERE id = ?', [id]);
  });
}

export async function getDirty(): Promise<Note[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM notes
    WHERE sync_status != 'synced'
    ORDER BY updated_at DESC
    `,
  );

  return hydrateNotes(rows);
}

export async function upsertFromServer(note: NoteDetailResponse): Promise<void> {
  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      INSERT OR REPLACE INTO notes (
        id, user_id, folder_id, title, content, summary, primary_language,
        is_starred, is_deleted, status, version, last_device_id,
        created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        note.id,
        requireCurrentUserId(),
        note.folderId,
        note.title,
        note.content,
        note.summary,
        note.primaryLanguage,
        toSqliteBoolean(note.isStarred),
        0,
        note.status,
        note.version,
        note.lastDeviceId,
        note.createdAt,
        note.updatedAt,
        'synced',
      ],
    );
    await replaceNoteTags(tx, note.id, note.tagIds);
  });
}

export async function resetSyncStatus(): Promise<void> {
  await getDatabase().execute(
    `
    UPDATE notes
    SET sync_status = 'synced'
    WHERE sync_status != 'synced'
    `,
  );
}

export async function getNoteCount(folderId: string): Promise<number> {
  const row = await getFirstRow<{ count: number }>(
    getDatabase(),
    `
    SELECT COUNT(*) AS count
    FROM notes
    WHERE folder_id = ? AND is_deleted = 0
    `,
    [folderId],
  );

  return row?.count ?? 0;
}
