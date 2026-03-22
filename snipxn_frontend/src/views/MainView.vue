<template>
  <div class="workspace-shell animate-fade-in">
    <div class="workspace-frame">
      <header class="workspace-topbar animate-fade-in-up delay-100">
        <div class="workspace-brand-block">
          <div class="workspace-brand-icon">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="40" height="40">
          </div>
          <div class="workspace-brand-copy">
            <h1 class="workspace-title">{{ t('workspace.title') }}</h1>
          </div>
        </div>

        <div
          ref="workspaceSearchRef"
          class="workspace-command"
          :class="{ 'workspace-command-open': showWorkspaceSearchDropdown }"
          @focusin="handleWorkspaceSearchFocusIn"
          @focusout="handleWorkspaceSearchFocusOut"
        >
          <div class="workspace-command-field">
            <i class="pi pi-search workspace-command-icon" aria-hidden="true" />
            <InputText
              id="workspace-command-search"
              :model-value="noteStore.searchQuery"
              :placeholder="t('sidebar.searchPlaceholder')"
              class="workspace-command-input"
              @update:model-value="handleWorkspaceSearchInput"
              @keydown.down.prevent="handleWorkspaceSearchStep(1)"
              @keydown.up.prevent="handleWorkspaceSearchStep(-1)"
              @keydown.enter.prevent="handleWorkspaceSearchEnter"
              @keydown.esc.prevent="handleWorkspaceSearchEscape"
            />
            <span class="workspace-command-shortcut" aria-hidden="true">
              <kbd>Ctrl</kbd>
              <kbd>K</kbd>
            </span>
          </div>

          <div
            v-if="showWorkspaceSearchDropdown"
            class="workspace-command-results"
            role="listbox"
            :aria-label="t('common.search')"
          >
            <button
              v-for="(note, index) in workspaceSearchResults"
              :key="note.id"
              type="button"
              class="workspace-command-result"
              :class="{ 'workspace-command-result-active': index === workspaceSearchActiveIndex }"
              role="option"
              :aria-selected="index === workspaceSearchActiveIndex"
              @mousedown.prevent
              @mouseenter="workspaceSearchActiveIndex = index"
              @click="handleOpenWorkspaceSearchResult(note)"
            >
              <div class="workspace-command-result-main">
                <span class="workspace-command-result-title">{{ note.title || t('notes.untitled') }}</span>
                <span class="workspace-command-result-summary">{{ note.searchSummary }}</span>
              </div>
              <div class="workspace-command-result-meta">
                <span class="workspace-command-result-folder">{{ note.folderName }}</span>
                <span class="workspace-command-result-language">{{ note.primaryLanguage || 'Markdown' }}</span>
              </div>
            </button>

            <div v-if="!workspaceSearchResults.length" class="workspace-command-empty">
              {{ t('workspace.searchNoResults') }}
            </div>
          </div>
        </div>

        <div class="workspace-topbar-side">
          <div class="workspace-summary">
            <article v-for="item in workspaceMetrics" :key="item.id" class="workspace-summary-card">
              <span class="workspace-summary-value">{{ item.value }}</span>
              <span class="workspace-summary-label">{{ item.label }}</span>
            </article>
          </div>

          <div class="workspace-topbar-actions">
            <div class="workspace-control-group">
              <ThemeToggle />
              <LangToggle />
            </div>
            <Button
              icon="pi pi-users"
              :label="t('community.title')"
              severity="secondary"
              outlined
              :aria-label="t('community.title')"
              :title="t('community.title')"
              class="workspace-community-btn"
              @click="handleOpenCommunity"
            />
            <Button
              icon="pi pi-plus"
              :label="t('notes.newNote')"
              class="accent-cta new-note-btn"
              @click="handleCreateNote"
            />
            <Button
              icon="pi pi-cog"
              severity="secondary"
              outlined
              :aria-label="t('sidebar.settings')"
              :title="t('sidebar.settings')"
              class="workspace-settings-btn"
              @click="handleOpenSettings"
            />
          </div>
        </div>
      </header>

      <div class="workspace-body animate-fade-in-up delay-150" :class="{ 'workspace-body-stacked': isStackedWorkspace }">
        <div class="workspace-sidebar-shell" :class="{ 'workspace-sidebar-shell-collapsed': isSidebarCollapsed }">
          <Sidebar
            :folders="folderStore.folders"
            :active-folder-id="folderStore.activeFolderId"
            :active-view="noteStore.activeView"
            :tags="noteStore.availableTags"
            :active-tag="noteStore.activeTag"
            :has-selected-note="Boolean(noteStore.currentNote || noteStore.selectedNoteId)"
            :user="displayUser"
            :storage-profile="userStore.profile"
            :storage-loading="userStore.loadingProfile"
            :storage-percent="userStore.storageUsagePercent"
            :collapsed="isSidebarCollapsed"
            @select-home="handleSelectHome"
            @select-folder="handleSelectFolder"
            @select-view="handleSelectView"
            @select-tag="noteStore.setActiveTag"
            @create-folder="openCreateFolderDialog"
            @edit-folder="openEditFolderDialog"
            @delete-folder="handleDeleteFolder"
            @create-tag="handleOpenTagDialog"
            @open-settings="handleOpenSettings"
            @logout="handleLogout"
          />
        </div>

        <div class="workspace-main">
          <Splitter
            :layout="contentSplitterLayout"
            :stateKey="contentSplitterStateKey"
            stateStorage="session"
            class="workspace-panels"
            :pt="{ root: { style: 'background: transparent; border: none;' } }"
          >
            <SplitterPanel :size="listPanelSize" :minSize="listPanelMinSize" class="workspace-list">
              <NoteList
                :title="noteListTitle"
                :notes="displayedNotes"
                :loading="bootstrapping || noteStore.loadingList"
                :selected-note-id="noteStore.selectedNoteId"
                :total="noteStore.total"
                :page="noteStore.page"
                :size="noteStore.size"
                :can-create="!noteStore.isTrashView"
                @select="handleSelectNote"
                @create="handleCreateNote"
                @change-page="handleChangePage"
                @import="handleImportNotes"
              />
            </SplitterPanel>

            <SplitterPanel :size="editorPanelSize" :minSize="editorPanelMinSize" class="workspace-editor">
              <WorkspaceHome
                v-if="showWorkspaceHome"
                :user="displayUser"
                :recent-notes="recentWorkspaceNotes"
                :folders="folderStore.folders"
                :metrics="workspaceMetrics"
                :storage-profile="userStore.profile"
                :storage-percent="userStore.storageUsagePercent"
                :active-folder-name="folderStore.activeFolder?.name || t('folders.defaultFolder')"
                @create-note="handleCreateNote"
                @create-folder="openCreateFolderDialog"
                @open-community="handleOpenCommunity"
                @open-settings="handleOpenSettings"
                @open-note="handleSelectNote"
              />
              <NoteEditor
                v-else
                :note="noteStore.currentNote"
                :loading="bootstrapping || noteStore.loadingDetail"
                :saving="noteStore.saving"
                :is-trash-view="noteStore.isTrashView"
                @create-note="handleCreateNote"
                @update:title="(value) => syncCurrentNote({ title: value })"
                @update:language="(value) => syncCurrentNote({ primaryLanguage: value })"
                @update:content="(value) => syncCurrentNote({ content: value })"
                @save="handleSaveNote"
                @toggle-star="handleToggleStar"
                @delete="handleDeleteNote"
                @restore="handleRestoreNote"
                @purge="handleDeletePermanently"
              />
            </SplitterPanel>
          </Splitter>
        </div>
      </div>
    </div>

    <FolderDialog v-model="folderDialogVisible" :folder="editingFolder" @submit="handleSubmitFolder" />
    <Dialog
      v-model:visible="tagDialogVisible"
      modal
      :draggable="false"
      :header="t('notes.newTag')"
      :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    >
      <form class="workspace-tag-form" @submit.prevent="handleCreateTag">
        <div class="workspace-tag-field">
          <label class="workspace-tag-label" for="workspace-new-tag">{{ t('notes.newTag') }}</label>
          <InputText
            id="workspace-new-tag"
            v-model="newTagName"
            class="w-full"
            :placeholder="t('notes.newTagPlaceholder')"
            autofocus
          />
        </div>

        <div class="workspace-tag-actions">
          <Button type="button" severity="secondary" text :label="t('common.cancel')" @click="tagDialogVisible = false" />
          <Button type="submit" icon="pi pi-plus" :label="t('common.create')" />
        </div>
      </form>
    </Dialog>
    <Dialog
      v-model:visible="confirmDialogVisible"
      modal
      :draggable="false"
      :header="t('common.delete')"
      :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
    >
      <div class="workspace-confirm-dialog">
        <div class="workspace-confirm-icon">
          <i class="pi pi-trash" aria-hidden="true" />
        </div>
        <div class="workspace-confirm-copy">
          <p class="workspace-confirm-message">{{ t('folders.deleteConfirm') }}</p>
        </div>
      </div>

      <div class="workspace-confirm-actions">
        <Button
          type="button"
          severity="secondary"
          text
          :label="t('common.cancel')"
          :disabled="confirmSubmitting"
          @click="closeConfirmDialog"
        />
        <Button
          type="button"
          severity="danger"
          :label="t('common.delete')"
          :loading="confirmSubmitting"
          @click="handleConfirmDialogAction"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/auth';
import { useFolderStore } from '../stores/folder';
import { useNoteStore } from '../stores/note';
import { useUserStore } from '../stores/user';
import { importNotes as importNotesApi } from '../api/note';
import Sidebar from '../components/layout/Sidebar.vue';
import NoteList from '../components/layout/NoteList.vue';
import NoteEditor from '../components/layout/NoteEditor.vue';
import WorkspaceHome from '../components/layout/WorkspaceHome.vue';
import FolderDialog from '../components/folder/FolderDialog.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import logoUrl from '../assets/logo.svg';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const folderStore = useFolderStore();
const noteStore = useNoteStore();
const userStore = useUserStore();

const VERTICAL_PANELS_BREAKPOINT = 1280;
const STACKED_WORKSPACE_BREAKPOINT = 980;
const bootstrapping = ref(true);
const folderDialogVisible = ref(false);
const editingFolder = ref(null);
const tagDialogVisible = ref(false);
const newTagName = ref('');
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const confirmDialogVisible = ref(false);
const confirmDialogTarget = ref(null);
const confirmSubmitting = ref(false);
const workspaceSearchRef = ref(null);
const workspaceSearchFocused = ref(false);
const workspaceSearchActiveIndex = ref(-1);

const displayUser = computed(() => userStore.profile || authStore.user || null);
const isStackedWorkspace = computed(() => windowWidth.value <= STACKED_WORKSPACE_BREAKPOINT);
const isSidebarCollapsed = computed(() => !isStackedWorkspace.value && windowWidth.value <= 1180);
const contentSplitterLayout = computed(() => (windowWidth.value <= VERTICAL_PANELS_BREAKPOINT ? 'vertical' : 'horizontal'));
const contentSplitterStateKey = computed(() => `snipxn-workspace-content-splitter-${contentSplitterLayout.value}`);
const listPanelSize = computed(() => (contentSplitterLayout.value === 'vertical' ? 34 : 31));
const listPanelMinSize = computed(() => (contentSplitterLayout.value === 'vertical' ? 24 : 22));
const editorPanelSize = computed(() => 100 - listPanelSize.value);
const editorPanelMinSize = computed(() => (contentSplitterLayout.value === 'vertical' ? 38 : 34));
const showWorkspaceHome = computed(() => (
  !bootstrapping.value
  && !noteStore.loadingDetail
  && !noteStore.currentNote
  && !noteStore.selectedNoteId
  && noteStore.activeView === 'folder'
  && !noteStore.isTrashView
));
const noteListTitle = computed(() => {
  if (noteStore.activeView === 'starred') {
    return t('sidebar.starred');
  }

  if (noteStore.activeView === 'trash') {
    return t('sidebar.trash');
  }

  return folderStore.activeFolder?.name || t('sidebar.folders');
});
const workspaceMetrics = computed(() => ([
  { id: 'notes', label: t('notes.title'), value: noteStore.total },
  { id: 'folders', label: t('sidebar.folders'), value: folderStore.folders.length },
  { id: 'tags', label: t('sidebar.tags'), value: noteStore.availableTags.length },
]));
const recentWorkspaceNotes = computed(() => (
  [...noteStore.notes]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())
    .slice(0, 5)
));
const displayedNotes = computed(() => {
  const activeTag = normalizeTags([noteStore.activeTag])[0] || '';

  if (!activeTag) {
    return noteStore.notes;
  }

  return noteStore.notes.filter((note) => (note.tagIds || []).map((tag) => String(tag || '').trim()).includes(activeTag));
});
const workspaceSearchResults = computed(() => {
  const query = String(noteStore.searchQuery || '').trim().toLowerCase();
  const activeTag = normalizeTags([noteStore.activeTag])[0] || '';

  if (!query) {
    return [];
  }

  return noteStore.notes
    .filter((note) => {
      const matchesTag = !activeTag || (note.tagIds || []).map((tag) => String(tag || '').trim()).includes(activeTag);
      const title = String(note.title || '').toLowerCase();
      const summary = String(note.summary || note.content || '').toLowerCase();
      const language = String(note.primaryLanguage || '').toLowerCase();

      return matchesTag && [title, summary, language].some((value) => value.includes(query));
    })
    .map((note) => {
      const title = String(note.title || '').toLowerCase();
      const summary = String(note.summary || note.content || '').toLowerCase();
      const language = String(note.primaryLanguage || '').toLowerCase();
      let rank = 4;

      if (title === query) rank = 0;
      else if (title.startsWith(query)) rank = 1;
      else if (title.includes(query)) rank = 2;
      else if (summary.includes(query)) rank = 3;
      else if (language.includes(query)) rank = 5;

      const folderName = folderStore.folders.find((folder) => String(folder.id) === String(note.folderId))?.name || t('folders.default');

      return {
        ...note,
        folderName,
        rank,
        searchSummary: note.summary || summarizeContent(note.content) || t('notes.emptySummary'),
      };
    })
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime();
    })
    .slice(0, 7);
});
const showWorkspaceSearchDropdown = computed(() => workspaceSearchFocused.value && String(noteStore.searchQuery || '').trim().length > 0);

function summarizeContent(content = '') {
  return String(content).replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*]\([^)]+\)/g, ' ').replace(/\[[^\]]+]\([^)]+\)/g, ' ').replace(/[#>*`_\-\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function normalizeTags(tags = []) {
  return Array.from(new Set(
    tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean),
  ));
}

function handleWorkspaceSearchInput(value) {
  noteStore.setSearchQuery(value);
  workspaceSearchActiveIndex.value = String(value || '').trim() ? 0 : -1;
}

function handleWorkspaceSearchFocusIn() {
  workspaceSearchFocused.value = true;
}

function handleWorkspaceSearchFocusOut(event) {
  const nextFocusedElement = event.relatedTarget;

  if (nextFocusedElement instanceof Node && workspaceSearchRef.value?.contains(nextFocusedElement)) {
    return;
  }

  workspaceSearchFocused.value = false;
  workspaceSearchActiveIndex.value = -1;
}

function handleWorkspaceSearchStep(direction) {
  if (!showWorkspaceSearchDropdown.value || !workspaceSearchResults.value.length) {
    return;
  }

  const nextIndex = workspaceSearchActiveIndex.value + direction;
  const resultsCount = workspaceSearchResults.value.length;
  workspaceSearchActiveIndex.value = (nextIndex + resultsCount) % resultsCount;
}

function handleWorkspaceSearchEscape() {
  workspaceSearchFocused.value = false;
  workspaceSearchActiveIndex.value = -1;
}

async function handleOpenWorkspaceSearchResult(note) {
  if (!note?.id) {
    return;
  }

  await handleSelectNote(note.id);
  workspaceSearchFocused.value = false;
  workspaceSearchActiveIndex.value = -1;
}

async function handleWorkspaceSearchEnter() {
  if (!showWorkspaceSearchDropdown.value || !workspaceSearchResults.value.length) {
    return;
  }

  const targetNote = workspaceSearchResults.value[Math.max(workspaceSearchActiveIndex.value, 0)];

  await handleOpenWorkspaceSearchResult(targetNote);
}

function updateListItem(noteId, patch) {
  const index = noteStore.notes.findIndex((item) => item.id === noteId);
  if (index === -1) return;
  noteStore.notes[index] = { ...noteStore.notes[index], ...patch };
}

function syncCurrentNote(patch) {
  if (!noteStore.currentNote) return;
  const nextNote = { ...noteStore.currentNote, ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, 'content')) nextNote.summary = summarizeContent(nextNote.content);
  noteStore.currentNote = nextNote;
  updateListItem(nextNote.id, { ...patch, summary: nextNote.summary });
}

async function refreshNotes(page = noteStore.page) {
  return noteStore.fetchNotes({
    view: noteStore.activeView,
    folderId: noteStore.activeView === 'folder' ? folderStore.activeFolderId : null,
    page,
    size: noteStore.size,
  });
}

function showError(error, fallbackKey) {
  toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t(fallbackKey), life: 3500 });
}

function resolveSharedWorkspaceQuery() {
  const noteId = String(route.query.noteId || '').trim();
  const requestedFolderId = String(route.query.folderId || '').trim();
  const folderExists = requestedFolderId && folderStore.folders.some((folder) => String(folder.id) === requestedFolderId);
  const folderId = folderExists ? requestedFolderId : (folderStore.activeFolderId || folderStore.folders[0]?.id || null);

  return {
    noteId,
    view: 'folder',
    folderId,
  };
}

async function bootstrapWorkspace() {
  bootstrapping.value = true;
  try {
    await Promise.allSettled([folderStore.fetchFolders(), userStore.fetchProfile()]);
    const sharedSelection = resolveSharedWorkspaceQuery();

    if (sharedSelection.folderId) {
      folderStore.setActiveFolder(sharedSelection.folderId);
    }

    await noteStore.fetchNotes({
      view: sharedSelection.view,
      folderId: sharedSelection.folderId,
      page: 1,
      size: noteStore.size,
      preserveSelection: false,
      autoSelect: false,
    });

    if (sharedSelection.noteId && noteStore.notes.some((note) => String(note.id) === sharedSelection.noteId)) {
      await noteStore.selectNote(sharedSelection.noteId);
    }
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  } finally {
    bootstrapping.value = false;
  }
}

async function handleSelectFolder(folderId) {
  if (noteStore.activeView === 'folder' && folderStore.activeFolderId === folderId) {
    return;
  }

  folderStore.setActiveFolder(folderId);
  try {
    await noteStore.setView('folder', folderId);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleSelectHome() {
  const targetFolderId = folderStore.activeFolderId || folderStore.folders[0]?.id || null;

  if (noteStore.activeView === 'folder' && !noteStore.currentNote && !noteStore.selectedNoteId) {
    return;
  }

  if (targetFolderId && folderStore.activeFolderId !== targetFolderId) {
    folderStore.setActiveFolder(targetFolderId);
  }

  try {
    await noteStore.fetchNotes({
      view: 'folder',
      folderId: targetFolderId,
      page: 1,
      size: noteStore.size,
      preserveSelection: false,
      autoSelect: false,
    });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleSelectView(view) {
  if (noteStore.activeView === view) {
    return;
  }

  try {
    await noteStore.setView(view, view === 'folder' ? folderStore.activeFolderId : null);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleSelectNote(noteId) {
  if (noteStore.selectedNoteId === noteId && noteStore.currentNote?.id === noteId) {
    return;
  }

  try {
    await noteStore.selectNote(noteId);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleChangePage(page) {
  try {
    await refreshNotes(page);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

function openCreateFolderDialog() {
  editingFolder.value = null;
  folderDialogVisible.value = true;
}

function openEditFolderDialog(folder) {
  editingFolder.value = folder;
  folderDialogVisible.value = true;
}

function openConfirmDialog(target = null) {
  confirmDialogTarget.value = target;
  confirmDialogVisible.value = true;
}

function closeConfirmDialog(force = false) {
  if (confirmSubmitting.value && !force) {
    return;
  }

  confirmDialogVisible.value = false;
  confirmDialogTarget.value = null;
}

function handleOpenTagDialog() {
  if (noteStore.isTrashView) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('notes.tagCreateDisabledInTrash'), life: 3000 });
    return;
  }

  if (!noteStore.currentNote) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('notes.tagCreateRequiresNote'), life: 3000 });
    return;
  }

  newTagName.value = '';
  tagDialogVisible.value = true;
}

async function handleSubmitFolder(payload) {
  try {
    if (editingFolder.value) {
      await folderStore.updateFolder(editingFolder.value.id, { ...payload, version: editingFolder.value.version });
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.updateSuccess'), life: 2500 });
      await refreshNotes();
    } else {
      await folderStore.createFolder(payload);
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.createSuccess'), life: 2500 });
      await noteStore.setView('folder', folderStore.activeFolderId);
    }
    folderDialogVisible.value = false;
    editingFolder.value = null;
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleDeleteFolder(folder) {
  if (!folder) return;
  openConfirmDialog(folder);
}

async function handleCreateNote() {
  if (!folderStore.folders.length) {
    openCreateFolderDialog();
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('notes.newNoteMissingFolder'), life: 3000 });
    return;
  }
  const targetFolderId = folderStore.activeFolderId || folderStore.folders[0]?.id || null;
  try {
    if (noteStore.activeView !== 'folder') await noteStore.setView('folder', targetFolderId);
    if (!folderStore.activeFolderId && targetFolderId) folderStore.setActiveFolder(targetFolderId);
    await noteStore.createNote({ folderId: targetFolderId, title: t('notes.newNoteTitle'), content: '', primaryLanguage: 'Markdown', tagIds: [] });
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.newNoteCreated'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleImportNotes(files) {
  const targetFolderId = folderStore.activeFolderId || folderStore.folders[0]?.id || null;
  try {
    const res = await importNotesApi(files, targetFolderId);
    const imported = res.data?.data || [];
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.importSuccess', { count: imported.length }), life: 3000 });
    await refreshNotes();
  } catch (error) {
    showError(error, 'notes.importFailed');
  }
}

function handleCreateTag() {
  const tagName = String(newTagName.value || '').trim();

  if (!tagName || !noteStore.currentNote) {
    return;
  }

  syncCurrentNote({
    tagIds: normalizeTags([...(noteStore.currentNote.tagIds || []), tagName]),
  });
  tagDialogVisible.value = false;
  newTagName.value = '';
  toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.tagAddedPendingSave'), life: 2600 });
}

async function handleSaveNote() {
  if (!noteStore.currentNote) return;
  try {
    await noteStore.saveCurrentNote();
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.saveSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'notes.saveFailed');
  }
}

async function handleToggleStar() {
  if (!noteStore.currentNote) return;
  const nextState = !noteStore.currentNote.isStarred;
  try {
    await noteStore.toggleStar();
    toast.add({ severity: 'success', summary: t('common.success'), detail: t(nextState ? 'notes.starredSuccess' : 'notes.unstarredSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'notes.saveFailed');
  }
}

async function handleDeleteNote() {
  if (!noteStore.currentNote) return;
  try {
    await noteStore.deleteCurrentNote();
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.deleteSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleRestoreNote() {
  if (!noteStore.currentNote) return;
  try {
    await noteStore.restoreCurrentNote();
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.restoreSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleDeletePermanently() {
  if (!noteStore.currentNote) return;
  try {
    await noteStore.deleteCurrentNotePermanently();
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.purgeSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleConfirmDialogAction() {
  confirmSubmitting.value = true;

  try {
    const folder = confirmDialogTarget.value;

    if (!folder?.id) {
      return;
    }

    await folderStore.deleteFolder(folder.id);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.deleteSuccess'), life: 2500 });
    await noteStore.setView('folder', folderStore.activeFolderId);
    closeConfirmDialog(true);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  } finally {
    confirmSubmitting.value = false;
  }
}

async function handleOpenCommunity() {
  await router.push('/community');
}

async function handleOpenSettings() {
  await router.push('/settings');
}

async function handleLogout() {
  await authStore.logout();
  await router.push('/');
}

function lockWorkspaceViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('workspace-locked');
  document.body.classList.add('workspace-locked');
}

function unlockWorkspaceViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('workspace-locked');
  document.body.classList.remove('workspace-locked');
}

function handleResize() {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
}

watch(
  () => workspaceSearchResults.value.length,
  (resultCount) => {
    if (!resultCount) {
      workspaceSearchActiveIndex.value = -1;
      return;
    }

    if (workspaceSearchActiveIndex.value < 0 || workspaceSearchActiveIndex.value >= resultCount) {
      workspaceSearchActiveIndex.value = 0;
    }
  },
);

onMounted(() => {
  lockWorkspaceViewport();
  bootstrapWorkspace();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  unlockWorkspaceViewport();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.workspace-shell {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-shell > * {
  min-width: 0;
  min-height: 0;
}

.workspace-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.workspace-topbar {
  position: relative;
  z-index: 18;
  overflow: visible;
  isolation: isolate;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(240px, 1fr) minmax(380px, auto);
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.workspace-brand-block,
.workspace-command-shortcut,
.workspace-topbar-side,
.workspace-summary,
.workspace-topbar-actions,
.workspace-control-group {
  display: flex;
  align-items: center;
}

.workspace-brand-block {
  gap: 0.7rem;
  min-width: 0;
}

.workspace-brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
}

.workspace-brand-copy {
  min-width: 0;
}

.workspace-summary-label {
  font-family: var(--font-mono);
}

.workspace-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.workspace-command {
  position: relative;
  z-index: 2;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  color: var(--text-color-secondary);
  transition: border-color 180ms ease, background-color 180ms ease;
}

.workspace-command:focus-within,
.workspace-command-open {
  z-index: 40;
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.workspace-command-field,
.workspace-command-result,
.workspace-command-result-main,
.workspace-command-result-meta {
  display: flex;
}

.workspace-command-field {
  min-height: 2.55rem;
  padding: 0 0.8rem;
  align-items: center;
  gap: 0.6rem;
}

.workspace-command-icon {
  color: var(--primary-color);
}

.workspace-command-input {
  flex: 1;
  min-width: 0;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.workspace-command-input::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 88%, transparent);
}

.workspace-command-shortcut {
  gap: 0.25rem;
  flex-shrink: 0;
}

.workspace-command-shortcut kbd {
  min-width: 1.85rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.45rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  text-align: center;
}

.workspace-command-results {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 80;
  display: grid;
  gap: 0;
  padding: 0.35rem 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 16%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-strong) 99%, transparent);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
}

.workspace-command-result {
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0.85rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease;
}

.workspace-command-result:hover,
.workspace-command-result-active {
  background: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.workspace-command-result-main {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
}

.workspace-command-result-title {
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
}

.workspace-command-result-summary {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workspace-command-result-meta {
  flex-shrink: 0;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-color-secondary);
  font-size: 0.76rem;
  white-space: nowrap;
}

.workspace-command-result-folder,
.workspace-command-result-language {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0 0.45rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 92%, transparent);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-command-empty {
  padding: 0.9rem 0.85rem;
  color: var(--text-color-secondary);
  font-size: 0.84rem;
}

.workspace-topbar-side {
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: 0;
}

.workspace-summary {
  gap: 0.55rem;
}

.workspace-summary-card {
  min-width: 4.5rem;
  padding: 0.35rem 0.6rem;
  border-left: 1px solid var(--app-border);
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.workspace-summary-value {
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.workspace-summary-label {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.workspace-topbar-actions {
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.workspace-control-group {
  gap: 0.3rem;
  padding-right: 0.5rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--app-border);
}

.workspace-community-btn,
.workspace-settings-btn {
  background: transparent;
}

.new-note-btn {
  min-width: max-content;
}

.workspace-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
}

.workspace-body-stacked {
  flex-direction: column;
}

.workspace-sidebar-shell {
  flex: 0 0 270px;
  min-width: 270px;
  max-width: 320px;
  min-height: 0;
  border-right: 1px solid var(--app-border);
  transition: flex-basis 180ms ease, min-width 180ms ease, max-width 180ms ease;
}

.workspace-sidebar-shell-collapsed {
  flex-basis: 96px;
  min-width: 96px;
  max-width: 96px;
}

.workspace-main,
.workspace-panels {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.workspace-main {
  display: flex;
}

.workspace-list,
.workspace-editor {
  height: 100%;
  background: transparent;
}

.workspace-list {
  --panel-surface: transparent;
  --panel-border: transparent;
  --panel-shadow: none;
  --panel-section-surface: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  --panel-section-strong: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  --panel-section-border: var(--app-border);
  --panel-empty-surface: color-mix(in srgb, var(--app-panel-muted) 82%, transparent);
  --panel-accent: color-mix(in srgb, var(--primary-color) 9%, transparent);
  --panel-accent-soft: color-mix(in srgb, var(--primary-color) 6%, transparent);
  border-right: 1px solid var(--app-border);
}

.workspace-editor {
  --panel-surface: transparent;
  --panel-border: transparent;
  --panel-shadow: none;
  --panel-section-surface: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  --panel-section-strong: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
  --panel-section-border: color-mix(in srgb, var(--primary-color) 16%, var(--app-border));
  --panel-empty-surface: color-mix(in srgb, var(--app-panel-muted) 78%, transparent);
  --editor-pane-surface: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
  --preview-pane-surface: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  --editor-pane-header-surface: color-mix(in srgb, var(--app-panel-subtle) 98%, transparent);
  --panel-accent: color-mix(in srgb, var(--primary-color) 10%, transparent);
  --panel-accent-soft: color-mix(in srgb, var(--primary-color) 6%, transparent);
}

:deep(.p-splitter) {
  height: 100%;
  min-height: 0;
}

:deep(.p-splitterpanel) {
  min-height: 0 !important;
}

:deep(.p-splitter-gutter) {
  background: var(--app-border) !important;
  width: 1px !important;
  cursor: col-resize;
}

:deep(.p-splitter-gutter-handle) {
  background: transparent !important;
}

:deep(.p-splitter.p-splitter-vertical > .p-splitter-gutter) {
  width: auto !important;
  height: 1px !important;
  cursor: row-resize;
}

:deep(.p-splitter.p-splitter-vertical > .p-splitter-gutter .p-splitter-gutter-handle) {
  width: 100%;
  height: 100%;
}

.workspace-tag-form,
.workspace-tag-field {
  display: flex;
  flex-direction: column;
}

.workspace-tag-form {
  gap: 1rem;
}

.workspace-tag-field {
  gap: 0.45rem;
}

.workspace-tag-label {
  font-size: 0.78rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.workspace-tag-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

.workspace-confirm-dialog {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.workspace-confirm-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--danger-color, #dc2626) 20%, var(--app-border));
  background: color-mix(in srgb, var(--danger-color, #dc2626) 10%, var(--app-panel-subtle));
  color: var(--danger-color, #dc2626);
  flex-shrink: 0;
}

.workspace-confirm-copy {
  min-width: 0;
  padding-top: 0.12rem;
}

.workspace-confirm-message {
  margin: 0;
  color: var(--text-color);
  line-height: 1.65;
}

.workspace-confirm-actions {
  margin-top: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

@media (max-width: 1380px) {
  .workspace-topbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .workspace-topbar-side {
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

@media (max-width: 980px) {
  .workspace-sidebar-shell {
    flex-basis: auto;
    min-width: 100%;
    max-width: none;
    height: min(24rem, 44vh);
    border-right: 0;
    border-bottom: 1px solid var(--app-border);
  }

  .workspace-main {
    min-height: 26rem;
  }
}

@media (max-width: 860px) {
  .workspace-summary {
    width: 100%;
    justify-content: space-between;
  }

  .workspace-summary-card {
    flex: 1;
  }

  .workspace-topbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .workspace-command-shortcut {
    display: none;
  }

  .workspace-command-result {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-command-result-meta {
    flex-wrap: wrap;
  }

  .workspace-topbar-actions :deep(.p-button-label) {
    display: none;
  }

  .new-note-btn :deep(.p-button-label) {
    display: inline;
  }

  .workspace-community-btn,
  .workspace-settings-btn {
    width: 2.875rem;
  }

  .workspace-summary {
    flex-wrap: wrap;
  }
}
</style>
