import type { Scalar } from '@op-engineering/op-sqlite';

import type { Folder, Note, PendingDelete, SyncFolderChange, SyncNoteChange, SyncPushRequest, SyncTagChange, Tag } from '../../types';
import { push as pushSyncRequest } from '../../api/sync';
import * as folderDao from '../dao/folderDao';
import * as noteDao from '../dao/noteDao';
import * as pendingDeleteDao from '../dao/pendingDeleteDao';
import * as syncMetaDao from '../dao/syncMetaDao';
import * as tagDao from '../dao/tagDao';
import { getDatabase } from '../database';

type SqlExecutor = {
  execute: (query: string, params?: Scalar[]) => Promise<unknown>;
};

function mapFolderChange(folder: Folder): SyncFolderChange {
  return {
    id: folder.id,
    name: folder.name,
    icon: folder.icon,
    rankIndex: folder.rankIndex,
    isDeleted: false,
    version: folder.syncStatus === 'created' ? null : folder.version,
  };
}

function mapNoteChange(note: Note): SyncNoteChange {
  return {
    id: note.id,
    folderId: note.folderId,
    title: note.title,
    content: note.content,
    primaryLanguage: note.primaryLanguage,
    isStarred: note.isStarred,
    isDeleted: false,
    version: note.syncStatus === 'created' ? null : note.version,
    tagIds: note.tagIds,
  };
}

function mapTagChange(tag: Tag): SyncTagChange {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    isDeleted: false,
    version: tag.syncStatus === 'created' ? null : tag.version,
  };
}

function createDeletedFolderChange(folder: Folder, pendingDelete: PendingDelete): SyncFolderChange {
  return {
    id: folder.id,
    name: folder.name,
    icon: folder.icon,
    rankIndex: folder.rankIndex,
    isDeleted: true,
    version: pendingDelete.version,
  };
}

function createDeletedNoteChange(note: Note, pendingDelete: PendingDelete): SyncNoteChange {
  return {
    id: note.id,
    folderId: note.folderId,
    title: note.title,
    content: note.content,
    primaryLanguage: note.primaryLanguage,
    isStarred: note.isStarred,
    isDeleted: true,
    version: pendingDelete.version,
    tagIds: note.tagIds,
  };
}

function createDeletedTagChange(tag: Tag, pendingDelete: PendingDelete): SyncTagChange {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    isDeleted: true,
    version: pendingDelete.version,
  };
}

async function buildDeletedFolderChanges(
  pendingDeletes: PendingDelete[],
): Promise<SyncFolderChange[]> {
  const changes: SyncFolderChange[] = [];

  for (const pendingDelete of pendingDeletes) {
    if (pendingDelete.tableName !== 'folders') {
      continue;
    }

    const folder = await folderDao.getById(pendingDelete.recordId);

    if (!folder) {
      continue;
    }

    changes.push(createDeletedFolderChange(folder, pendingDelete));
  }

  return changes;
}

async function buildDeletedNoteChanges(
  pendingDeletes: PendingDelete[],
): Promise<SyncNoteChange[]> {
  const changes: SyncNoteChange[] = [];

  for (const pendingDelete of pendingDeletes) {
    if (pendingDelete.tableName !== 'notes') {
      continue;
    }

    const note = await noteDao.getById(pendingDelete.recordId);

    if (!note) {
      continue;
    }

    changes.push(createDeletedNoteChange(note, pendingDelete));
  }

  return changes;
}

async function buildDeletedTagChanges(
  pendingDeletes: PendingDelete[],
): Promise<SyncTagChange[]> {
  const changes: SyncTagChange[] = [];

  for (const pendingDelete of pendingDeletes) {
    if (pendingDelete.tableName !== 'tags') {
      continue;
    }

    const tag = await tagDao.getById(pendingDelete.recordId);

    if (!tag) {
      continue;
    }

    changes.push(createDeletedTagChange(tag, pendingDelete));
  }

  return changes;
}

async function purgeDeletedRecords(
  executor: SqlExecutor,
  pendingDeletes: PendingDelete[],
): Promise<void> {
  for (const pendingDelete of pendingDeletes) {
    switch (pendingDelete.tableName) {
      case 'folders': {
        await executor.execute('DELETE FROM folders WHERE id = ?', [pendingDelete.recordId]);
        break;
      }
      case 'notes': {
        await executor.execute('DELETE FROM note_tags WHERE note_id = ?', [pendingDelete.recordId]);
        await executor.execute('DELETE FROM notes WHERE id = ?', [pendingDelete.recordId]);
        break;
      }
      case 'tags': {
        await executor.execute('DELETE FROM note_tags WHERE tag_id = ?', [pendingDelete.recordId]);
        await executor.execute('DELETE FROM tags WHERE id = ?', [pendingDelete.recordId]);
        break;
      }
    }
  }
}

async function cleanupAfterSuccessfulPush(pendingDeletes: PendingDelete[]): Promise<void> {
  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE folders
      SET sync_status = 'synced'
      WHERE sync_status != 'synced'
      `,
    );
    await tx.execute(
      `
      UPDATE notes
      SET sync_status = 'synced'
      WHERE sync_status != 'synced'
      `,
    );
    await tx.execute(
      `
      UPDATE tags
      SET sync_status = 'synced'
      WHERE sync_status != 'synced'
      `,
    );
    await purgeDeletedRecords(tx, pendingDeletes);
    await tx.execute('DELETE FROM pending_deletes');
  });
}

export async function pushChanges(): Promise<void> {
  const [dirtyFolders, dirtyNotes, dirtyTags, pendingDeletes] = await Promise.all([
    folderDao.getDirty(),
    noteDao.getDirty(),
    tagDao.getDirty(),
    pendingDeleteDao.getAll(),
  ]);

  if (
    dirtyFolders.length === 0 &&
    dirtyNotes.length === 0 &&
    dirtyTags.length === 0 &&
    pendingDeletes.length === 0
  ) {
    return;
  }

  const [deviceId, lastPulledAt, deletedFolderChanges, deletedNoteChanges, deletedTagChanges] =
    await Promise.all([
      syncMetaDao.getDeviceId(),
      syncMetaDao.getLastPulledAt(),
      buildDeletedFolderChanges(pendingDeletes),
      buildDeletedNoteChanges(pendingDeletes),
      buildDeletedTagChanges(pendingDeletes),
    ]);

  const request: SyncPushRequest = {
    deviceId,
    lastPulledAt,
    folders: [
      ...dirtyFolders
        .filter(folder => folder.syncStatus === 'created' || folder.syncStatus === 'updated')
        .map(mapFolderChange),
      ...deletedFolderChanges,
    ],
    notes: [
      ...dirtyNotes
        .filter(note => note.syncStatus === 'created' || note.syncStatus === 'updated')
        .map(mapNoteChange),
      ...deletedNoteChanges,
    ],
    tags: [
      ...dirtyTags
        .filter(tag => tag.syncStatus === 'created' || tag.syncStatus === 'updated')
        .map(mapTagChange),
      ...deletedTagChanges,
    ],
  };

  await pushSyncRequest(request);
  await cleanupAfterSuccessfulPush(pendingDeletes);
}
