import { defineStore } from 'pinia';
import * as noteApi from '../api/note';
import * as tagApi from '../api/tag';
import { getDeviceId } from '../composables/useDeviceId';
import { useFolderStore } from './folder';

function isSameId(left, right) {
  return String(left ?? '') === String(right ?? '');
}

function isMissingFolderError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('文件夹不存在') || message.includes('folder not found');
}

async function recoverValidFolderSelection(noteStore, invalidFolderId = null) {
  const folderStore = useFolderStore();
  await folderStore.fetchFolders();

  const fallbackFolder = folderStore.folders.find((folder) => folder.isDefault && !isSameId(folder.id, invalidFolderId))
    || folderStore.folders.find((folder) => !isSameId(folder.id, invalidFolderId))
    || folderStore.folders[0]
    || null;

  const fallbackFolderId = fallbackFolder?.id || null;
  folderStore.setActiveFolder(fallbackFolderId);
  noteStore.activeFolderId = fallbackFolderId;
  return fallbackFolderId;
}

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    tags: [],
    currentNote: null,
    selectedNoteId: null,
    loadingList: false,
    loadingDetail: false,
    detailRequestId: 0,
    saving: false,
    page: 1,
    size: 20,
    total: 0,
    activeView: 'folder',
    activeFolderId: null,
    searchQuery: '',
    activeTag: '',
  }),
  getters: {
    filteredNotes: (state) => {
      const query = state.searchQuery.trim().toLowerCase();

      return state.notes.filter((note) => {
        const matchesQuery = !query || [note.title, note.summary, note.primaryLanguage]
          .some((value) => String(value || '').toLowerCase().includes(query));
        const matchesTag = !state.activeTag || (note.tagIds || []).includes(state.activeTag);

        return matchesQuery && matchesTag;
      });
    },
    availableTags: (state) => state.tags,
    isTrashView: (state) => state.activeView === 'trash',
  },
  actions: {
    setSearchQuery(query) {
      this.searchQuery = query;
    },
    setActiveTag(tag = '') {
      this.activeTag = tag;
    },
    buildNotePayload(note, overrides = {}) {
      return {
        folderId: overrides.folderId ?? note.folderId ?? null,
        title: overrides.title ?? note.title ?? '',
        content: overrides.content ?? note.content ?? '',
        primaryLanguage: overrides.primaryLanguage ?? note.primaryLanguage ?? 'Markdown',
        isStarred: overrides.isStarred ?? note.isStarred ?? false,
        tagIds: overrides.tagIds ?? note.tagIds ?? [],
        deviceId: getDeviceId(),
        version: overrides.version ?? note.version,
      };
    },
    async fetchTags() {
      const res = await tagApi.listTags();
      this.tags = res.data || [];

      if (this.activeTag && !this.tags.some((tag) => String(tag.id) === String(this.activeTag))) {
        this.activeTag = '';
      }

      return res;
    },
    async addTag(name, color) {
      const res = await tagApi.createTag({ name, color });

      if (res.data) {
        this.tags.push(res.data);
      }

      return res;
    },
    async removeTag(tagId) {
      const res = await tagApi.deleteTag(tagId);
      this.tags = this.tags.filter((tag) => String(tag.id) !== String(tagId));

      if (String(this.activeTag) === String(tagId)) {
        this.activeTag = '';
      }

      this.notes = this.notes.map((note) => ({
        ...note,
        tagIds: (note.tagIds || []).filter((id) => String(id) !== String(tagId)),
      }));

      if (this.currentNote) {
        this.currentNote = {
          ...this.currentNote,
          tagIds: (this.currentNote.tagIds || []).filter((id) => String(id) !== String(tagId)),
        };
      }

      return res;
    },
    async editTag(tagId, name, color) {
      const res = await tagApi.updateTag(tagId, { name, color });
      const idx = this.tags.findIndex((tag) => tag.id === tagId);

      if (idx !== -1) {
        this.tags[idx] = {
          ...this.tags[idx],
          name,
          color,
        };
      }

      return res;
    },
    async fetchNotes(options = {}) {
      const view = options.view ?? this.activeView;
      const folderId = Object.prototype.hasOwnProperty.call(options, 'folderId')
        ? options.folderId
        : this.activeFolderId;
      const page = options.page ?? this.page;
      const size = options.size ?? this.size;
      const autoSelect = options.autoSelect ?? true;

      this.loadingList = true;
      this.activeView = view;
      this.activeFolderId = view === 'folder' ? folderId : null;

      try {
        let res;

        if (view === 'starred') {
          res = await noteApi.listStarredNotes({ page, size });
        } else if (view === 'trash') {
          res = await noteApi.listTrashNotes({ page, size });
        } else {
          const params = { page, size };

          if (folderId) {
            params.folderId = folderId;
          }

          res = await noteApi.listNotes(params);
        }

        const data = res.data || {};
        this.notes = data.records || [];
        this.total = data.total ?? this.notes.length;
        this.page = data.page ?? page;
        this.size = data.size ?? size;

        if (!this.notes.length) {
          this.detailRequestId += 1;
          this.loadingDetail = false;
          this.selectedNoteId = null;
          this.currentNote = null;
          return res;
        }

        if (!autoSelect) {
          this.detailRequestId += 1;
          this.loadingDetail = false;
          this.selectedNoteId = null;
          this.currentNote = null;
          return res;
        }

        const preferredNoteId = options.preserveSelection === false
          ? this.notes[0].id
          : this.notes.find((note) => note.id === this.selectedNoteId)?.id || this.notes[0].id;

        await this.selectNote(preferredNoteId);

        return res;
      } catch (error) {
        if (view === 'folder' && folderId && !options._recoveredMissingFolder && isMissingFolderError(error)) {
          const fallbackFolderId = await recoverValidFolderSelection(this, folderId);

          if (fallbackFolderId && !isSameId(fallbackFolderId, folderId)) {
            return this.fetchNotes({
              ...options,
              view: 'folder',
              folderId: fallbackFolderId,
              preserveSelection: false,
              _recoveredMissingFolder: true,
            });
          }
        }

        throw error;
      } finally {
        this.loadingList = false;
      }
    },
    async setView(view, folderId = null) {
      this.page = 1;
      this.activeTag = '';

      return this.fetchNotes({
        view,
        folderId,
        page: 1,
        size: this.size,
        preserveSelection: false,
      });
    },
    async selectNote(noteId) {
      if (!noteId) {
        this.detailRequestId += 1;
        this.loadingDetail = false;
        this.selectedNoteId = null;
        this.currentNote = null;
        return null;
      }

      const requestId = this.detailRequestId + 1;
      this.detailRequestId = requestId;
      this.selectedNoteId = noteId;
      this.loadingDetail = true;

      try {
        const res = await noteApi.getNote(noteId);

        if (requestId !== this.detailRequestId) {
          return this.currentNote;
        }

        this.currentNote = res.data || null;

        return this.currentNote;
      } finally {
        if (requestId === this.detailRequestId) {
          this.loadingDetail = false;
        }
      }
    },
    async createNote(payload = {}) {
      this.saving = true;

      try {
        const targetFolderId = payload.folderId ?? this.activeFolderId;
        const res = await noteApi.createNote({
          folderId: targetFolderId,
          title: payload.title ?? '',
          content: payload.content ?? '',
          primaryLanguage: payload.primaryLanguage ?? 'Markdown',
          tagIds: payload.tagIds ?? [],
          deviceId: getDeviceId(),
        });

        await this.fetchNotes({
          view: this.activeView === 'trash' ? 'folder' : this.activeView,
          folderId: targetFolderId,
          page: 1,
          size: this.size,
          preserveSelection: false,
        });

        if (res.data?.id) {
          await this.selectNote(res.data.id);
        }

        return res;
      } catch (error) {
        const invalidFolderId = payload.folderId ?? this.activeFolderId;

        if (invalidFolderId && !payload._recoveredMissingFolder && isMissingFolderError(error)) {
          const fallbackFolderId = await recoverValidFolderSelection(this, invalidFolderId);

          if (fallbackFolderId && !isSameId(fallbackFolderId, invalidFolderId)) {
            return this.createNote({
              ...payload,
              folderId: fallbackFolderId,
              _recoveredMissingFolder: true,
            });
          }
        }

        throw error;
      } finally {
        this.saving = false;
      }
    },
    async saveCurrentNote(overrides = {}) {
      if (!this.currentNote?.id) {
        return null;
      }

      const quiet = overrides.quiet === true;
      this.saving = true;

      try {
        const noteId = this.currentNote.id;
        const payload = this.buildNotePayload(this.currentNote, overrides);
        await noteApi.updateNote(noteId, payload);

        if (quiet) {
          const nextVersion = (this.currentNote.version ?? 0) + 1;
          const nextUpdatedAt = new Date().toISOString();
          this.currentNote = { ...this.currentNote, version: nextVersion, updatedAt: nextUpdatedAt };
          const idx = this.notes.findIndex((n) => n.id === noteId);
          if (idx !== -1) {
            this.notes[idx] = { ...this.notes[idx], version: nextVersion, updatedAt: nextUpdatedAt };
          }
          return this.currentNote;
        }

        await this.fetchNotes({
          view: this.activeView,
          folderId: overrides.folderId ?? this.activeFolderId,
          page: this.page,
          size: this.size,
        });

        if (this.notes.some((note) => note.id === noteId)) {
          await this.selectNote(noteId);
        }

        return this.currentNote;
      } finally {
        this.saving = false;
      }
    },
    async toggleStar() {
      if (!this.currentNote) {
        return null;
      }

      return this.saveCurrentNote({
        isStarred: !this.currentNote.isStarred,
      });
    },
    async moveCurrentNote(folderId) {
      return this.saveCurrentNote({ folderId });
    },
    async deleteCurrentNote() {
      if (!this.currentNote?.id) {
        return null;
      }

      const noteId = this.currentNote.id;
      await noteApi.deleteNote(noteId);

      return this.fetchNotes({
        view: this.activeView,
        folderId: this.activeFolderId,
        page: this.page,
        size: this.size,
        preserveSelection: false,
      });
    },
    async restoreCurrentNote() {
      if (!this.currentNote?.id) {
        return null;
      }

      await noteApi.restoreNote(this.currentNote.id);

      return this.fetchNotes({
        view: this.activeView,
        folderId: this.activeFolderId,
        page: this.page,
        size: this.size,
        preserveSelection: false,
      });
    },
    async deleteCurrentNotePermanently() {
      if (!this.currentNote?.id) {
        return null;
      }

      await noteApi.deleteNotePermanently(this.currentNote.id);

      return this.fetchNotes({
        view: this.activeView,
        folderId: this.activeFolderId,
        page: this.page,
        size: this.size,
        preserveSelection: false,
      });
    },
  },
});
