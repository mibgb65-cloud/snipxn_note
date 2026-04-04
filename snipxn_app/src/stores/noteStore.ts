import { create } from 'zustand';

import * as noteDao from '../db/dao/noteDao';
import * as tagDao from '../db/dao/tagDao';
import { getDatabase } from '../db/database';
import { isOnline } from '../db/sync/networkMonitor';
import type { Note, Tag } from '../types';
import { getDeviceId } from '../utils/deviceId';
import { buildSummary } from '../utils/markdown';
import { toISOString } from '../utils/time';
import { generateUUID } from '../utils/uuid';
import { useAuthStore } from './authStore';
import { useFolderStore } from './folderStore';
import { useSyncStore } from './syncStore';

const NOTE_PAGE_SIZE = 1000;
const SEARCH_DEBOUNCE_MS = 300;
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

type NoteView = 'folder' | 'all' | 'starred' | 'trash';

export interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  selectedNoteId: string | null;
  tags: Tag[];
  loading: boolean;
  saving: boolean;
  activeView: NoteView;
  searchQuery: string;
  activeTagId: string | null;
  filteredNotes: () => Note[];
  fetchNotes: () => Promise<void>;
  selectNote: (id: string) => Promise<void>;
  createNote: (folderId: string) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentDeleteNote: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  setActiveView: (view: NoteView) => void;
  setSearchQuery: (query: string) => void;
  setActiveTagId: (tagId: string | null) => void;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<void>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

const initialNoteState = {
  notes: [],
  currentNote: null,
  selectedNoteId: null,
  tags: [],
  loading: false,
  saving: false,
  activeView: 'folder',
  searchQuery: '',
  activeTagId: null,
} satisfies Pick<
  NoteState,
  | 'notes'
  | 'currentNote'
  | 'selectedNoteId'
  | 'tags'
  | 'loading'
  | 'saving'
  | 'activeView'
  | 'searchQuery'
  | 'activeTagId'
>;

function requireCurrentUser(): NonNullable<ReturnType<typeof useAuthStore.getState>['user']> {
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error('Authenticated user is required for note operations.');
  }

  return user;
}

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

function matchesSearch(note: Note, query: string): boolean {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return [note.title, note.summary ?? '', note.content].some(value =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function applyFilters(notes: Note[], searchQuery: string, activeTagId: string | null): Note[] {
  return notes.filter(note => {
    if (!matchesSearch(note, searchQuery)) {
      return false;
    }

    if (activeTagId && !note.tagIds.includes(activeTagId)) {
      return false;
    }

    return true;
  });
}

async function loadNotesForView(
  userId: string,
  activeView: NoteView,
  activeFolderId: string | null,
  searchQuery: string,
): Promise<Note[]> {
  const normalizedQuery = normalizeQuery(searchQuery);

  if (normalizedQuery.length > 0) {
    if (activeView === 'trash') {
      const trashNotes = await noteDao.getTrash(userId);
      return trashNotes.filter(note => matchesSearch(note, normalizedQuery));
    }

    const searchedNotes = await noteDao.search(userId, normalizedQuery);

    if (activeView === 'folder') {
      if (!activeFolderId) {
        return searchedNotes;
      }

      return searchedNotes.filter(note => note.folderId === activeFolderId);
    }

    if (activeView === 'starred') {
      return searchedNotes.filter(note => note.isStarred);
    }

    return searchedNotes;
  }

  if (activeView === 'folder') {
    if (!activeFolderId) {
      return noteDao.getAllForUser(userId);
    }

    return noteDao.getByFolder(activeFolderId, 1, NOTE_PAGE_SIZE);
  }

  if (activeView === 'all') {
    return noteDao.getAllForUser(userId);
  }

  if (activeView === 'starred') {
    return noteDao.getStarred(userId);
  }

  return noteDao.getTrash(userId);
}

async function trySyncNotes(): Promise<void> {
  const result = await useSyncStore.getState().syncNow();

  if (
    result.status !== 'success' &&
    result.status !== 'already_syncing' &&
    result.status !== 'offline'
  ) {
    console.warn('Note sync completed with a non-fatal status.', result);
  }
}

async function scheduleNotePush(): Promise<void> {
  if (!(await isOnline())) {
    useSyncStore.getState().setOffline();
    return;
  }

  await useSyncStore.getState().schedulePush();
}

async function refreshCurrentNote(
  selectedNoteId: string | null,
  set: (partial: Partial<NoteState>) => void,
): Promise<void> {
  if (!selectedNoteId) {
    set({ currentNote: null });
    return;
  }

  const note = await noteDao.getById(selectedNoteId);

  if (!note) {
    set({ currentNote: null, selectedNoteId: null });
    return;
  }

  set({ currentNote: note });
}

async function deleteTagLocally(tag: Tag): Promise<void> {
  const now = toISOString();

  await getDatabase().transaction(async tx => {
    await tx.execute('DELETE FROM note_tags WHERE tag_id = ?', [tag.id]);

    if (tag.syncStatus === 'created') {
      await tx.execute('DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?', [
        'tags',
        tag.id,
      ]);
      await tx.execute('DELETE FROM tags WHERE id = ?', [tag.id]);
      return;
    }

    await tx.execute(
      `
      UPDATE tags
      SET is_deleted = 1,
          updated_at = ?,
          sync_status = 'deleted'
      WHERE id = ?
      `,
      [now, tag.id],
    );
    await tx.execute('DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?', [
      'tags',
      tag.id,
    ]);
    await tx.execute(
      `
      INSERT INTO pending_deletes (id, table_name, record_id, version, created_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [generateUUID(), 'tags', tag.id, tag.version, now],
    );
  });
}

export const useNoteStore = create<NoteState>((set, get) => ({
  ...initialNoteState,
  filteredNotes: () => {
    const state = get();
    return applyFilters(state.notes, state.searchQuery, state.activeTagId);
  },
  fetchNotes: async () => {
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ notes: [], currentNote: null, selectedNoteId: null, loading: false });
      return;
    }

    set({ loading: true });

    try {
      const { activeView, searchQuery } = get();
      const activeFolderId = useFolderStore.getState().activeFolderId;
      const notes = await loadNotesForView(user.id, activeView, activeFolderId, searchQuery);

      set({ notes, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  selectNote: async id => {
    set({ loading: true });

    try {
      const note = await noteDao.getById(id);

      if (!note) {
        set({ currentNote: null, selectedNoteId: null, loading: false });
        throw new Error('Note not found.');
      }

      set({ currentNote: note, selectedNoteId: id, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  createNote: async folderId => {
    const user = requireCurrentUser();
    const [deviceId, now] = await Promise.all([getDeviceId(), Promise.resolve(toISOString())]);
    const note: Note = {
      id: generateUUID(),
      userId: user.id,
      folderId,
      title: '无标题笔记',
      content: '',
      summary: null,
      primaryLanguage: null,
      isStarred: false,
      isDeleted: false,
      status: 'NORMAL',
      version: 1,
      lastDeviceId: deviceId,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'created',
      tagIds: [],
    };

    set({ saving: true });

    try {
      await noteDao.insert(note);
      set({ currentNote: note, selectedNoteId: note.id, saving: false });
      await get().fetchNotes();
      await trySyncNotes();
      return note;
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  updateNote: async (id, data) => {
    const existingNote = await noteDao.getById(id);

    if (!existingNote) {
      throw new Error('Note not found.');
    }

    set({ saving: true });

    try {
      const nextContent = data.content ?? existingNote.content;
      const nextTagIds = data.tagIds ?? existingNote.tagIds;
      const updatedAt = toISOString();
      const summaryText = buildSummary(nextContent);

      await noteDao.update({
        ...data,
        id,
        content: nextContent,
        summary: summaryText.length > 0 ? summaryText : null,
        tagIds: nextTagIds,
        updatedAt,
        lastDeviceId: data.lastDeviceId ?? (await getDeviceId()),
      });

      await refreshCurrentNote(get().selectedNoteId, set);
      set({ saving: false });
      await get().fetchNotes();
      void scheduleNotePush();
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  deleteNote: async id => {
    const existingNote = await noteDao.getById(id);

    if (!existingNote) {
      throw new Error('Note not found.');
    }

    set({ saving: true });

    try {
      if (existingNote.syncStatus === 'created') {
        await noteDao.permanentDelete(id);
      } else {
        await noteDao.markDeleted(id, existingNote.version);
      }

      if (get().selectedNoteId === id) {
        set({ currentNote: null, selectedNoteId: null });
      }

      set({ saving: false });
      await get().fetchNotes();
      await trySyncNotes();
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  restoreNote: async id => {
    const existingNote = await noteDao.getById(id);

    if (!existingNote) {
      throw new Error('Note not found.');
    }

    set({ saving: true });

    try {
      await noteDao.restore(id);
      await refreshCurrentNote(get().selectedNoteId, set);
      set({ saving: false });
      await get().fetchNotes();
      await trySyncNotes();
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  permanentDeleteNote: async id => {
    const existingNote = await noteDao.getById(id);

    if (!existingNote) {
      throw new Error('Note not found.');
    }

    set({ saving: true });

    try {
      await noteDao.permanentDelete(id);

      if (get().selectedNoteId === id) {
        set({ currentNote: null, selectedNoteId: null });
      }

      set({ saving: false });
      await get().fetchNotes();
      await trySyncNotes();
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  toggleStar: async id => {
    const existingNote = await noteDao.getById(id);

    if (!existingNote) {
      throw new Error('Note not found.');
    }

    set({ saving: true });

    try {
      await noteDao.update({
        id,
        isStarred: !existingNote.isStarred,
        updatedAt: toISOString(),
        lastDeviceId: await getDeviceId(),
      });

      await refreshCurrentNote(get().selectedNoteId, set);
      set({ saving: false });
      await get().fetchNotes();
      await trySyncNotes();
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
  setActiveView: view => {
    set({ activeView: view });
    void get().fetchNotes();
  },
  setSearchQuery: query => {
    set({ searchQuery: query });
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      void get().fetchNotes();
    }, SEARCH_DEBOUNCE_MS);
  },
  setActiveTagId: tagId => {
    set({ activeTagId: tagId });
  },
  fetchTags: async () => {
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ tags: [], activeTagId: null });
      return;
    }

    const tags = await tagDao.getAll(user.id);

    set(state => ({
      tags,
      activeTagId:
        state.activeTagId && tags.some(tag => tag.id === state.activeTagId)
          ? state.activeTagId
          : null,
    }));
  },
  createTag: async (name, color) => {
    const user = requireCurrentUser();
    const now = toISOString();
    const tag: Tag = {
      id: generateUUID(),
      userId: user.id,
      name,
      color: color ?? null,
      isDeleted: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'created',
    };

    await tagDao.insert(tag);
    await get().fetchTags();
    await trySyncNotes();
  },
  updateTag: async (id, data) => {
    const existingTag = await tagDao.getById(id);

    if (!existingTag) {
      throw new Error('Tag not found.');
    }

    await tagDao.update({
      ...data,
      id,
    });
    await get().fetchTags();
    await refreshCurrentNote(get().selectedNoteId, set);
    await get().fetchNotes();
    await trySyncNotes();
  },
  deleteTag: async id => {
    const existingTag = await tagDao.getById(id);

    if (!existingTag) {
      throw new Error('Tag not found.');
    }

    await deleteTagLocally(existingTag);
    await get().fetchTags();
    await refreshCurrentNote(get().selectedNoteId, set);
    await get().fetchNotes();
    await trySyncNotes();
  },
}));

export function resetNoteStore(): void {
  useNoteStore.setState(initialNoteState);
}
