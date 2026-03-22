import { defineStore } from 'pinia';
import * as folderApi from '../api/folder';

function pickDefaultFolder(folders) {
  return folders.find((folder) => folder.isDefault) || folders[0] || null;
}

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [],
    loading: false,
    activeFolderId: null,
  }),
  getters: {
    activeFolder: (state) => state.folders.find((folder) => folder.id === state.activeFolderId) || null,
    folderOptions: (state) => state.folders.map((folder) => ({
      label: folder.name,
      value: folder.id,
    })),
  },
  actions: {
    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
    },
    async fetchFolders() {
      this.loading = true;

      try {
        const res = await folderApi.getFolders();
        this.folders = res.data || [];

        if (!this.folders.some((folder) => folder.id === this.activeFolderId)) {
          this.activeFolderId = pickDefaultFolder(this.folders)?.id || null;
        }

        return this.folders;
      } finally {
        this.loading = false;
      }
    },
    async createFolder(payload) {
      const res = await folderApi.createFolder(payload);
      await this.fetchFolders();

      if (res.data?.id) {
        this.activeFolderId = res.data.id;
      }

      return res;
    },
    async updateFolder(folderId, payload) {
      await folderApi.updateFolder(folderId, payload);
      await this.fetchFolders();
    },
    async deleteFolder(folderId) {
      await folderApi.deleteFolder(folderId);
      await this.fetchFolders();
    },
  },
});
