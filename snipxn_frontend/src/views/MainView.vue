<template>
  <div class="workspace-shell animate-fade-in" :class="{ 'workspace-shell-mobile': isPhone }">
    <div class="workspace-frame">
      <!-- ── Desktop topbar ── -->
      <header v-if="!isPhone" class="workspace-topbar animate-fade-in-up delay-100">
        <div class="workspace-brand-block">
          <div class="workspace-brand-icon">
            <img class="workspace-brand-logo" :src="logoUrl" :alt="t('app.logoAlt')" width="40" height="40">
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
          <div v-if="!showWorkspaceHome" class="workspace-summary">
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
              icon="pi pi-cog"
              :label="t('sidebar.settings')"
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

      <!-- ── Mobile topbar ── -->
      <header v-if="isPhone" class="mobile-topbar">
        <button
          v-if="mobileActivePanel === 'editor'"
          class="mobile-topbar-back"
          @click="mobileGoBack"
        >
          <i class="pi pi-arrow-left" />
        </button>
        <button
          v-else
          class="mobile-topbar-menu"
          @click="showMobileSidebar = !showMobileSidebar"
        >
          <i class="pi pi-bars" />
        </button>

        <h1 class="mobile-topbar-title">{{ mobileNavTitle }}</h1>

        <div class="mobile-topbar-actions">
          <button class="mobile-topbar-btn" @click="handleCreateNote" :title="t('notes.createNote')">
            <i class="pi pi-plus" />
          </button>
          <button class="mobile-topbar-btn" @click="handleOpenSettings" :title="t('sidebar.settings')">
            <i class="pi pi-cog" />
          </button>
        </div>
      </header>

      <!-- ── Mobile search bar ── -->
      <div v-if="isPhone" class="mobile-search-bar">
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
              id="workspace-command-search-mobile"
              :model-value="noteStore.searchQuery"
              :placeholder="t('sidebar.searchPlaceholder')"
              class="workspace-command-input"
              @update:model-value="handleWorkspaceSearchInput"
              @keydown.enter.prevent="handleWorkspaceSearchEnter"
              @keydown.esc.prevent="handleWorkspaceSearchEscape"
            />
          </div>
          <div
            v-if="showWorkspaceSearchDropdown"
            class="workspace-command-results"
            role="listbox"
          >
            <button
              v-for="(note, index) in workspaceSearchResults"
              :key="note.id"
              type="button"
              class="workspace-command-result"
              :class="{ 'workspace-command-result-active': index === workspaceSearchActiveIndex }"
              role="option"
              @mousedown.prevent
              @click="handleOpenWorkspaceSearchResult(note)"
            >
              <div class="workspace-command-result-main">
                <span class="workspace-command-result-title">{{ note.title || t('notes.untitled') }}</span>
                <span class="workspace-command-result-summary">{{ note.searchSummary }}</span>
              </div>
            </button>
            <div v-if="!workspaceSearchResults.length" class="workspace-command-empty">
              {{ t('workspace.searchNoResults') }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Mobile sidebar drawer ── -->
      <Transition name="mobile-drawer">
        <div v-if="isPhone && showMobileSidebar" class="mobile-sidebar-backdrop" @click="showMobileSidebar = false" />
      </Transition>
      <Transition name="mobile-sidebar-slide">
        <div v-if="isPhone && showMobileSidebar" class="mobile-sidebar-drawer">
          <Sidebar
            :folders="folderStore.folders"
            :active-folder-id="folderStore.activeFolderId"
            :active-view="noteStore.activeView"
            :home-active="showWorkspaceHome"
            :tags="noteStore.tags"
            :active-tag="noteStore.activeTag"
            :has-selected-note="Boolean(noteStore.currentNote || noteStore.selectedNoteId)"
            :user="displayUser"
            :storage-profile="userStore.profile"
            :storage-loading="userStore.loadingProfile"
            :storage-percent="userStore.storageUsagePercent"
            :collapsed="false"
            @select-home="() => { handleSelectHome(); showMobileSidebar = false; }"
            @select-folder="handleSelectFolder"
            @select-view="handleSelectView"
            @select-tag="(tag) => { noteStore.setActiveTag(tag); showMobileSidebar = false; mobileActivePanel = 'list'; }"
            @create-folder="handleCreateFolder"
            @update-folder="handleUpdateFolder"
            @delete-folder="handleDeleteFolder"
            @create-tag="handleCreateTag"
            @delete-tag="handleDeleteTag"
            @open-settings="() => { showMobileSidebar = false; handleOpenSettings(); }"
            @logout="handleLogout"
          />
        </div>
      </Transition>

      <!-- ── Desktop body (unchanged) ── -->
      <div v-if="!isPhone" class="workspace-body animate-fade-in-up delay-150" :class="{ 'workspace-body-stacked': isStackedWorkspace }">
        <div class="workspace-sidebar-shell" :class="{ 'workspace-sidebar-shell-collapsed': isSidebarCollapsed }">
          <Sidebar
            :folders="folderStore.folders"
            :active-folder-id="folderStore.activeFolderId"
            :active-view="noteStore.activeView"
            :home-active="showWorkspaceHome"
            :tags="noteStore.tags"
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
            @create-folder="handleCreateFolder"
            @update-folder="handleUpdateFolder"
            @delete-folder="handleDeleteFolder"
            @create-tag="handleCreateTag"
            @delete-tag="handleDeleteTag"
            @open-settings="handleOpenSettings"
            @logout="handleLogout"
          />
        </div>

        <div class="workspace-main" :class="{ 'workspace-main-home': showWorkspaceHome }">
          <Transition name="workspace-stage" mode="out-in">
            <WorkspaceHome
              v-if="showWorkspaceHome"
              key="workspace-home"
              :user="displayUser"
              :recent-notes="recentWorkspaceNotes"
              :folders="folderStore.folders"
              :metrics="workspaceMetrics"
              :storage-profile="userStore.profile"
              :storage-percent="userStore.storageUsagePercent"
              :active-folder-name="folderStore.activeFolder?.name || t('folders.defaultFolder')"
              @create-note="handleCreateNote"
              @create-folder="handleCreateFolder({ name: t('folders.defaultFolderName'), icon: 'pi pi-folder' })"
              @open-community="handleOpenCommunity"
              @open-settings="handleOpenSettings"
              @open-note="handleSelectNote"
            />
            <Splitter
              v-else
              key="workspace-panels"
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
                <NoteEditor
                  :note="noteStore.currentNote"
                  :loading="bootstrapping || noteStore.loadingDetail"
                  :saving="noteStore.saving"
                  :is-trash-view="noteStore.isTrashView"
                  @create-note="handleCreateNote"
                  @update:title="(value) => syncCurrentNote({ title: value })"
                  @update:language="(value) => syncCurrentNote({ primaryLanguage: value })"
                  @update:content="(value) => syncCurrentNote({ content: value })"
                  @toggle-star="handleToggleStar"
                  @delete="handleDeleteNote"
                  @restore="handleRestoreNote"
                  @purge="handleDeletePermanently"
                />
              </SplitterPanel>
            </Splitter>
          </Transition>
        </div>
      </div>

      <!-- ── Mobile body: single-panel switching ── -->
      <div v-if="isPhone" class="mobile-body">
        <Transition name="mobile-panel" mode="out-in">
          <div v-if="showWorkspaceHome && mobileActivePanel === 'list'" key="mobile-home" class="mobile-panel">
            <WorkspaceHome
              :user="displayUser"
              :recent-notes="recentWorkspaceNotes"
              :folders="folderStore.folders"
              :metrics="workspaceMetrics"
              :storage-profile="userStore.profile"
              :storage-percent="userStore.storageUsagePercent"
              :active-folder-name="folderStore.activeFolder?.name || t('folders.defaultFolder')"
              @create-note="handleCreateNote"
              @create-folder="handleCreateFolder({ name: t('folders.defaultFolderName'), icon: 'pi pi-folder' })"
              @open-community="handleOpenCommunity"
              @open-settings="handleOpenSettings"
              @open-note="handleSelectNote"
            />
          </div>

          <div v-else-if="mobileActivePanel === 'list'" key="mobile-list" class="mobile-panel">
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
          </div>

          <div v-else-if="mobileActivePanel === 'editor'" key="mobile-editor" class="mobile-panel">
            <NoteEditor
              :note="noteStore.currentNote"
              :loading="bootstrapping || noteStore.loadingDetail"
              :saving="noteStore.saving"
              :is-trash-view="noteStore.isTrashView"
              :mobile="true"
              @create-note="handleCreateNote"
              @update:title="(value) => syncCurrentNote({ title: value })"
              @update:language="(value) => syncCurrentNote({ primaryLanguage: value })"
              @update:content="(value) => syncCurrentNote({ content: value })"
              @toggle-star="handleToggleStar"
              @delete="handleDeleteNote"
              @restore="handleRestoreNote"
              @purge="handleDeletePermanently"
            />
          </div>
        </Transition>
      </div>
    </div>

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
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { useLogoUrl } from '../composables/useLogoUrl';
import { useBreakpoints, BREAKPOINTS } from '../composables/useBreakpoints';

const { logoUrl } = useLogoUrl();
const { isPhone } = useBreakpoints();

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
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const workspaceSearchRef = ref(null);
const workspaceSearchFocused = ref(false);
const workspaceSearchActiveIndex = ref(-1);
const workspaceHomeVisible = ref(true);

/* ── Mobile panel navigation ── */
const mobileActivePanel = ref('list');       // 'sidebar' | 'list' | 'editor'
const showMobileSidebar = ref(false);

function mobileGoBack() {
  if (mobileActivePanel.value === 'editor') mobileActivePanel.value = 'list';
  else if (mobileActivePanel.value === 'sidebar') mobileActivePanel.value = 'list';
}

const mobileNavTitle = computed(() => {
  if (mobileActivePanel.value === 'sidebar') return t('sidebar.title') || 'Menu';
  if (mobileActivePanel.value === 'editor') return noteStore.currentNote?.title || t('notes.untitled');
  return noteListTitle.value;
});

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
  && workspaceHomeVisible.value
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
  { id: 'tags', label: t('sidebar.tags'), value: noteStore.tags.length },
]));
const recentWorkspaceNotes = computed(() => (
  [...noteStore.notes]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())
    .slice(0, 5)
));
const displayedNotes = computed(() => noteStore.filteredNotes);
const workspaceSearchResults = computed(() => {
  const query = String(noteStore.searchQuery || '').trim().toLowerCase();

  if (!query) {
    return [];
  }

  return noteStore.filteredNotes
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

let autoSaveTimer = null;

async function flushAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
  if (!noteStore.currentNote || noteStore.saving || noteStore.isTrashView) return;
  try {
    await noteStore.saveCurrentNote({ quiet: true });
  } catch (_) { /* silent */ }
}

function syncCurrentNote(patch) {
  if (!noteStore.currentNote) return;
  const nextNote = { ...noteStore.currentNote, ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, 'content')) nextNote.summary = summarizeContent(nextNote.content);
  noteStore.currentNote = nextNote;
  updateListItem(nextNote.id, { ...patch, summary: nextNote.summary });

  if (!noteStore.isTrashView) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(flushAutoSave, 2000);
  }
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

function getResolvedActiveFolderId() {
  return folderStore.activeFolder?.id || folderStore.folders[0]?.id || null;
}

function resolveSharedWorkspaceQuery() {
  const noteId = String(route.query.noteId || '').trim();
  const requestedFolderId = String(route.query.folderId || '').trim();
  const folderExists = requestedFolderId && folderStore.folders.some((folder) => String(folder.id) === requestedFolderId);
  const folderId = folderExists ? requestedFolderId : getResolvedActiveFolderId();

  return {
    noteId,
    view: 'folder',
    folderId,
  };
}

async function ensureBootstrapFolder() {
  if (folderStore.folders.length) {
    return getResolvedActiveFolderId();
  }

  await folderStore.createFolder({
    name: 'Inbox',
    icon: 'pi pi-inbox',
  });

  return getResolvedActiveFolderId();
}

async function bootstrapWorkspace() {
  bootstrapping.value = true;
  try {
    const [foldersResult, profileResult] = await Promise.allSettled([
      folderStore.fetchFolders(),
      userStore.fetchProfile(),
    ]);

    if (foldersResult.status === 'rejected') {
      throw foldersResult.reason;
    }

    if (profileResult.status === 'rejected') {
      console.error(profileResult.reason);
    }

    await ensureBootstrapFolder();

    const sharedSelection = resolveSharedWorkspaceQuery();
    const openDirectWorkspaceTarget = Boolean(sharedSelection.noteId || String(route.query.folderId || '').trim());
    workspaceHomeVisible.value = !openDirectWorkspaceTarget;
    const bootstrapFolderId = openDirectWorkspaceTarget ? sharedSelection.folderId : null;

    if (bootstrapFolderId) {
      folderStore.setActiveFolder(sharedSelection.folderId);
    }

    try {
      await noteStore.fetchTags();
    } catch (error) {
      console.error(error);
    }

    await noteStore.fetchNotes({
      view: sharedSelection.view,
      folderId: bootstrapFolderId,
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
  if (!showWorkspaceHome.value && noteStore.activeView === 'folder' && folderStore.activeFolderId === folderId) {
    return;
  }

  workspaceHomeVisible.value = false;
  folderStore.setActiveFolder(folderId);
  if (isPhone.value) { showMobileSidebar.value = false; mobileActivePanel.value = 'list'; }
  try {
    await noteStore.setView('folder', folderId);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleSelectHome() {
  workspaceHomeVisible.value = true;

  if (noteStore.activeView === 'folder' && !noteStore.currentNote && !noteStore.selectedNoteId) {
    return;
  }

  try {
    await noteStore.fetchNotes({
      view: 'folder',
      folderId: null,
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

  workspaceHomeVisible.value = false;
  if (isPhone.value) { showMobileSidebar.value = false; mobileActivePanel.value = 'list'; }
  try {
    await noteStore.setView(view, view === 'folder' ? getResolvedActiveFolderId() : null);
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleSelectNote(noteId) {
  if (noteStore.selectedNoteId === noteId && noteStore.currentNote?.id === noteId) {
    return;
  }

  workspaceHomeVisible.value = false;
  await flushAutoSave();

  try {
    await noteStore.selectNote(noteId);
    if (isPhone.value) mobileActivePanel.value = 'editor';
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

async function handleCreateFolder(payload) {
  try {
    await folderStore.createFolder(payload);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.createSuccess'), life: 2500 });
    await noteStore.setView('folder', getResolvedActiveFolderId());
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleUpdateFolder({ folder, payload } = {}) {
  if (!folder?.id || !payload) {
    return;
  }

  try {
    await folderStore.updateFolder(folder.id, { ...payload, version: folder.version });
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.updateSuccess'), life: 2500 });
    await refreshNotes();
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleDeleteFolder(folder) {
  if (!folder) return;
  try {
    await folderStore.deleteFolder(folder.id);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('folders.deleteSuccess'), life: 2500 });
    await noteStore.setView('folder', getResolvedActiveFolderId());
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleCreateNote() {
  if (!folderStore.folders.length) {
    await handleCreateFolder({ name: t('folders.defaultFolderName'), icon: 'pi pi-folder' });
  }
  const targetFolderId = getResolvedActiveFolderId();
  if (!targetFolderId) return;
  try {
    workspaceHomeVisible.value = false;
    if (noteStore.activeView !== 'folder') await noteStore.setView('folder', targetFolderId);
    if (!folderStore.activeFolder && targetFolderId) folderStore.setActiveFolder(targetFolderId);
    await noteStore.createNote({ folderId: targetFolderId, title: t('notes.newNoteTitle'), content: '', primaryLanguage: 'Markdown', tagIds: [] });
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.newNoteCreated'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleImportNotes(files) {
  const targetFolderId = getResolvedActiveFolderId();
  try {
    const res = await importNotesApi(files, targetFolderId);
    const imported = res.data?.data || [];
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.importSuccess', { count: imported.length }), life: 3000 });
    await refreshNotes();
  } catch (error) {
    showError(error, 'notes.importFailed');
  }
}

async function handleCreateTag(payload = {}) {
  const name = String(payload.name || '').trim();
  const color = String(payload.color || '').trim() || '#14b8a6';

  if (!name) return;

  try {
    await noteStore.addTag(name, color);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.tagCreateSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
  }
}

async function handleDeleteTag(tagId) {
  if (!tagId) {
    return;
  }

  try {
    await noteStore.removeTag(tagId);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('notes.tagDeleteSuccess'), life: 2500 });
  } catch (error) {
    showError(error, 'workspace.loadFailed');
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
  if (isPhone.value) return;
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

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    flushAutoSave();
  }
}

function handleBeforeUnload() {
  flushAutoSave();
}

onMounted(() => {
  lockWorkspaceViewport();
  bootstrapWorkspace();
  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  flushAutoSave();
  unlockWorkspaceViewport();
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
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
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
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
  display: grid;
  place-items: center;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
  overflow: hidden;
}

.workspace-brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
  color: var(--text-color-secondary);
  transition: border-color 180ms ease, background-color 180ms ease;
}

.workspace-command:focus-within,
.workspace-command-open {
  z-index: 40;
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
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
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
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
  background: color-mix(in srgb, var(--app-panel-raised) 99%, transparent);
  box-shadow: var(--app-shadow-soft);
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
  background: color-mix(in srgb, var(--app-panel-inset) 94%, transparent);
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
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-inset) 88%, transparent);
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

.workspace-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
  background: color-mix(in srgb, var(--app-panel-inset) 34%, transparent);
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
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
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
  position: relative;
  overflow: hidden;
}

.workspace-main-home {
  overflow: auto;
}

.workspace-stage-enter-active,
.workspace-stage-leave-active {
  transition:
    opacity 260ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: opacity, transform, filter;
}

.workspace-stage-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.994);
  filter: blur(4px);
}

.workspace-stage-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.997);
  filter: blur(3px);
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

  .workspace-community-btn,
  .workspace-settings-btn {
    width: 2.875rem;
  }

  .workspace-summary {
    flex-wrap: wrap;
  }
}

/* ═══════════════════════════════════════════════════════════
   Mobile-specific styles (< 768px)
   ═══════════════════════════════════════════════════════════ */

.workspace-shell-mobile {
  height: 100dvh;
}

/* ── Mobile topbar ── */
.mobile-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 3.25rem;
  padding: 0 0.75rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
  z-index: 18;
}

.mobile-topbar-back,
.mobile-topbar-menu {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-color);
  font-size: 1.05rem;
  cursor: pointer;
}

.mobile-topbar-back:active,
.mobile-topbar-menu:active {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.mobile-topbar-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.mobile-topbar-btn {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 1rem;
  cursor: pointer;
}

.mobile-topbar-btn:active {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
}

/* ── Mobile search bar ── */
.mobile-search-bar {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
}

.mobile-search-bar .workspace-command {
  width: 100%;
}

.mobile-search-bar .workspace-command-field {
  min-height: 2.25rem;
  padding: 0 0.6rem;
}

/* ── Mobile sidebar drawer ── */
.mobile-sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.mobile-sidebar-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(80vw, 320px);
  z-index: 1000;
  background: color-mix(in srgb, var(--app-panel-strong) 99%, transparent);
  border-right: 1px solid var(--app-border);
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* drawer transitions */
.mobile-drawer-enter-active,
.mobile-drawer-leave-active {
  transition: opacity 0.25s ease;
}
.mobile-drawer-enter-from,
.mobile-drawer-leave-to {
  opacity: 0;
}

.mobile-sidebar-slide-enter-active,
.mobile-sidebar-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile-sidebar-slide-enter-from,
.mobile-sidebar-slide-leave-to {
  transform: translateX(-100%);
}

/* ── Mobile body ── */
.mobile-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* mobile panel transitions */
.mobile-panel-enter-active,
.mobile-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile-panel-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.mobile-panel-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* ── Touch-friendly splitter gutter ── */
@media (pointer: coarse) {
  :deep(.p-splitter-gutter) {
    width: 10px !important;
    touch-action: none;
  }

  :deep(.p-splitter-gutter)::after {
    content: '';
    position: absolute;
    inset: -6px;
  }

  :deep(.p-splitter-gutter-handle) {
    width: 3px;
    height: 28px;
    border-radius: 2px;
    background: var(--surface-400) !important;
  }

  :deep(.p-splitter.p-splitter-vertical > .p-splitter-gutter) {
    height: 10px !important;
  }
}
</style>
