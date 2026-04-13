import { create } from 'zustand';

import * as folderDao from '../db/dao/folderDao';
import { getDatabase } from '../db/database';
import type { Folder } from '../types';
import { toISOString } from '../utils/time';
import { generateUUID } from '../utils/uuid';
import { useAuthStore } from './authStore';
import { useSyncStore } from './syncStore';

export interface FolderState {
  folders: Folder[];
  activeFolderId: string | null;
  loading: boolean;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, icon?: string) => Promise<Folder>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  reorderFolders: (folderIds: string[]) => Promise<void>;
  setActiveFolder: (id: string | null) => void;
}

const initialFolderState = {
  folders: [],
  activeFolderId: null,
  loading: false,
} satisfies Pick<FolderState, 'folders' | 'activeFolderId' | 'loading'>;

export function createFolderRankIndex(order: number): string {
  return `r_${String(order).padStart(6, '0')}`;
}

function requireCurrentUser(): NonNullable<ReturnType<typeof useAuthStore.getState>['user']> {
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error('Authenticated user is required for folder operations.');
  }

  return user;
}

function resolveActiveFolderId(
  folders: Folder[],
  currentActiveFolderId: string | null,
): string | null {
  if (currentActiveFolderId && folders.some(folder => folder.id === currentActiveFolderId)) {
    return currentActiveFolderId;
  }

  return folders.find(folder => folder.isDefault)?.id ?? folders[0]?.id ?? null;
}

async function trySyncFolders(): Promise<void> {
  const result = await useSyncStore.getState().syncNow();

  if (
    result.status !== 'success' &&
    result.status !== 'already_syncing' &&
    result.status !== 'offline'
  ) {
    console.warn('Folder sync completed with a non-fatal status.', result);
  }
}

async function moveNotesAndDeleteFolder(folder: Folder, defaultFolderId: string): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute(
      `
      UPDATE notes
      SET folder_id = ?,
          updated_at = ?,
          sync_status = CASE
            WHEN sync_status = 'created' THEN 'created'
            WHEN sync_status = 'deleted' THEN 'deleted'
            ELSE 'updated'
          END
      WHERE folder_id = ?
      `,
      [defaultFolderId, now, folder.id],
    );

    if (folder.syncStatus === 'created') {
      await tx.execute('DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?', [
        'folders',
        folder.id,
      ]);
      await tx.execute('DELETE FROM folders WHERE id = ?', [folder.id]);
      return;
    }

    await tx.execute(
      `
      UPDATE folders
      SET is_deleted = 1,
          updated_at = ?,
          sync_status = 'deleted'
      WHERE id = ?
      `,
      [now, folder.id],
    );
    await tx.execute('DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?', [
      'folders',
      folder.id,
    ]);
    await tx.execute(
      `
      INSERT INTO pending_deletes (id, table_name, record_id, version, created_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [generateUUID(), 'folders', folder.id, folder.version, now],
    );
  });
}

export const useFolderStore = create<FolderState>((set, get) => ({
  ...initialFolderState,
  fetchFolders: async () => {
    const user = useAuthStore.getState().user;

    if (!user) {
      set(initialFolderState);
      return;
    }

    set({ loading: true });

    try {
      const folders = await folderDao.getAll(user.id);

      set(state => ({
        folders,
        activeFolderId: resolveActiveFolderId(folders, state.activeFolderId),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  createFolder: async (name, icon = 'folder') => {
    const user = requireCurrentUser();
    const now = toISOString();
    const nextOrder = get().folders.length;
    const folder: Folder = {
      id: generateUUID(),
      userId: user.id,
      name,
      icon,
      isDefault: false,
      rankIndex: createFolderRankIndex(nextOrder),
      isDeleted: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'created',
    };

    await folderDao.insert(folder);
    set({ activeFolderId: folder.id });
    await get().fetchFolders();
    await trySyncFolders();
    return folder;
  },
  updateFolder: async (id, data) => {
    const existingFolder = await folderDao.getById(id);

    if (!existingFolder) {
      throw new Error('Folder not found.');
    }

    await folderDao.update({
      ...data,
      id,
    });
    await get().fetchFolders();
    await trySyncFolders();
  },
  deleteFolder: async id => {
    const user = requireCurrentUser();
    const folder = await folderDao.getById(id);

    if (!folder) {
      throw new Error('Folder not found.');
    }

    if (folder.isDefault) {
      throw new Error('Default folder cannot be deleted.');
    }

    const defaultFolder = await folderDao.getDefault(user.id);

    if (defaultFolder.id === folder.id) {
      throw new Error('Default folder cannot be deleted.');
    }

    await moveNotesAndDeleteFolder(folder, defaultFolder.id);

    if (get().activeFolderId === folder.id) {
      set({ activeFolderId: defaultFolder.id });
    }

    await get().fetchFolders();
    await trySyncFolders();
  },
  reorderFolders: async folderIds => {
    const currentFolders = get().folders;
    const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
    const reorderedFolders = folderIds
      .map(folderId => folderMap.get(folderId))
      .filter((folder): folder is Folder => Boolean(folder));

    if (reorderedFolders.length !== currentFolders.length) {
      throw new Error('Folder reorder payload is invalid.');
    }

    const now = toISOString();

    await getDatabase().transaction(async tx => {
      for (const [index, folder] of reorderedFolders.entries()) {
        await tx.execute(
          `
          UPDATE folders
          SET rank_index = ?,
              updated_at = ?,
              sync_status = CASE
                WHEN sync_status = 'created' THEN 'created'
                WHEN sync_status = 'deleted' THEN 'deleted'
                ELSE 'updated'
              END
          WHERE id = ?
          `,
          [createFolderRankIndex(index), now, folder.id],
        );
      }
    });

    await get().fetchFolders();
    await trySyncFolders();
  },
  setActiveFolder: id => {
    set({ activeFolderId: id });
  },
}));

export function resetFolderStore(): void {
  useFolderStore.setState(initialFolderState);
}
