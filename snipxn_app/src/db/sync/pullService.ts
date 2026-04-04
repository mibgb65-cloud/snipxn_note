import type { DB } from '@op-engineering/op-sqlite';

import type {
  FolderResponse,
  NoteDetailResponse,
  SyncPullResponse,
  SyncStatus,
} from '../../types';
import { pull as pullSyncResponse } from '../../api/sync';
import { getDatabase } from '../database';
import * as syncMetaDao from '../dao/syncMetaDao';
import {
  LAST_PULLED_AT_META_KEY,
  clearPendingDeleteRecord,
  getFirstRow,
  replaceNoteTags,
  requireCurrentUserId,
  toSqliteBoolean,
} from '../dao/internal';

import { resolveConflict } from './conflictResolver';

type TransactionExecutor = Parameters<DB['transaction']>[0] extends (tx: infer T) => Promise<void>
  ? T
  : never;

interface LocalFolderRow {
  id: string;
  version: number;
  sync_status: SyncStatus;
}

interface LocalNoteRow {
  id: string;
  version: number;
  sync_status: SyncStatus;
}

interface LocalTagRow {
  id: string;
  version: number;
  sync_status: SyncStatus;
  created_at: string;
}

async function getLocalFolder(tx: TransactionExecutor, id: string): Promise<LocalFolderRow | null> {
  return getFirstRow<LocalFolderRow>(
    tx,
    'SELECT id, version, sync_status FROM folders WHERE id = ? LIMIT 1',
    [id],
  );
}

async function getLocalNote(tx: TransactionExecutor, id: string): Promise<LocalNoteRow | null> {
  return getFirstRow<LocalNoteRow>(
    tx,
    'SELECT id, version, sync_status FROM notes WHERE id = ? LIMIT 1',
    [id],
  );
}

async function getLocalTag(tx: TransactionExecutor, id: string): Promise<LocalTagRow | null> {
  return getFirstRow<LocalTagRow>(
    tx,
    'SELECT id, version, sync_status, created_at FROM tags WHERE id = ? LIMIT 1',
    [id],
  );
}

async function upsertFolderFromRemote(
  tx: TransactionExecutor,
  userId: string,
  folder: FolderResponse,
): Promise<void> {
  await tx.execute(
    `
    INSERT OR REPLACE INTO folders (
      id, user_id, name, icon, is_default, rank_index,
      is_deleted, version, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      folder.id,
      userId,
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
  await clearPendingDeleteRecord(tx, 'folders', folder.id);
}

async function upsertNoteFromRemote(
  tx: TransactionExecutor,
  userId: string,
  note: NoteDetailResponse,
): Promise<void> {
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
      userId,
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
  await clearPendingDeleteRecord(tx, 'notes', note.id);
}

async function upsertTagFromRemote(
  tx: TransactionExecutor,
  userId: string,
  tag: SyncPullResponse['tags'][number],
  createdAt: string,
): Promise<void> {
  await tx.execute(
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
  await clearPendingDeleteRecord(tx, 'tags', tag.id);
}

async function removeDeletedItem(
  tx: TransactionExecutor,
  deletedItem: SyncPullResponse['deletedItems'][number],
): Promise<void> {
  switch (deletedItem.tableName) {
    case 'folders': {
      await tx.execute('DELETE FROM folders WHERE id = ?', [deletedItem.recordId]);
      break;
    }
    case 'notes': {
      await tx.execute('DELETE FROM note_tags WHERE note_id = ?', [deletedItem.recordId]);
      await tx.execute('DELETE FROM notes WHERE id = ?', [deletedItem.recordId]);
      break;
    }
    case 'tags': {
      await tx.execute('DELETE FROM note_tags WHERE tag_id = ?', [deletedItem.recordId]);
      await tx.execute('DELETE FROM tags WHERE id = ?', [deletedItem.recordId]);
      break;
    }
  }

  await clearPendingDeleteRecord(tx, deletedItem.tableName, deletedItem.recordId);
}

export async function pullChanges(): Promise<void> {
  const lastPulledAt = await syncMetaDao.getLastPulledAt();
  const response = await pullSyncResponse(lastPulledAt ?? undefined);
  const userId = requireCurrentUserId();

  await getDatabase().transaction(async tx => {
    for (const folder of response.folders) {
      const localFolder = await getLocalFolder(tx, folder.id);

      if (
        !localFolder ||
        localFolder.sync_status === 'synced' ||
        resolveConflict('folders', localFolder, folder) === 'use_remote'
      ) {
        await upsertFolderFromRemote(tx, userId, folder);
      }
    }

    for (const note of response.notes) {
      const localNote = await getLocalNote(tx, note.id);

      if (
        !localNote ||
        localNote.sync_status === 'synced' ||
        resolveConflict('notes', localNote, note) === 'use_remote'
      ) {
        await upsertNoteFromRemote(tx, userId, note);
      }
    }

    for (const tag of response.tags) {
      const localTag = await getLocalTag(tx, tag.id);

      if (
        !localTag ||
        localTag.sync_status === 'synced' ||
        resolveConflict('tags', localTag, tag) === 'use_remote'
      ) {
        await upsertTagFromRemote(tx, userId, tag, localTag?.created_at ?? tag.updatedAt);
      }
    }

    for (const deletedItem of response.deletedItems) {
      await removeDeletedItem(tx, deletedItem);
    }

    await tx.execute(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      [LAST_PULLED_AT_META_KEY, response.serverTime],
    );
  });
}
