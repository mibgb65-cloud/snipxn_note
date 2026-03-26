<template>
  <aside class="panel sidebar-panel" :class="{ 'sidebar-panel-collapsed': collapsed }">
    <div class="sidebar-brand-card" :class="{ 'sidebar-brand-card-collapsed': collapsed }">
      <template v-if="collapsed">
        <div class="sidebar-collapsed-stack">
          <Button
            icon="pi pi-plus"
            text
            rounded
            size="small"
            :aria-label="t('sidebar.createFolder')"
            :title="t('sidebar.createFolder')"
            @click="emit('create-folder', { name: t('folders.defaultFolderName'), icon: 'pi pi-folder' })"
          />
        </div>
      </template>

      <template v-else>
        <div class="sidebar-brand-row">
          <div class="min-w-0">
            <div class="min-w-0">
              <div class="sidebar-brand">{{ t('app.name') }}</div>
              <div class="sidebar-subtitle">{{ t('app.subtitle') }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="sidebar-section sidebar-section-folders" :class="{ 'sidebar-section-collapsed': collapsed }">
      <button
        type="button"
        class="sidebar-home-button"
        :class="{
          'sidebar-home-button-active': isHomeActive,
          'sidebar-home-button-collapsed': collapsed,
        }"
        :aria-current="isHomeActive ? 'page' : undefined"
        :title="t('sidebar.home')"
        @click="$emit('select-home')"
      >
        <span class="sidebar-home-icon">
          <i class="pi pi-home" aria-hidden="true" />
        </span>
        <span v-if="!collapsed" class="sidebar-home-copy">
          <span class="sidebar-home-label">{{ t('sidebar.home') }}</span>
          <span class="sidebar-home-hint">{{ t('workspace.subtitle') }}</span>
        </span>
        <i v-if="!collapsed" class="pi pi-angle-right sidebar-home-arrow" aria-hidden="true" />
      </button>

      <div v-if="!collapsed" class="section-header">
        <span>{{ t('sidebar.folders') }}</span>
        <div ref="folderPopoverAnchorRef" class="sidebar-popover-anchor">
          <Button
            icon="pi pi-plus"
            text
            rounded
            :aria-label="t('sidebar.createFolder')"
            @click="togglePopover('folder')"
          />
        </div>
      </div>

      <Teleport to="body">
        <transition name="sidebar-popover">
          <div
            v-if="activePopover === 'folder'"
            ref="folderPopoverRef"
            class="sidebar-popover sidebar-popover-folder"
            :style="popoverStyle"
            role="dialog"
            @click.stop
          >
            <span class="sidebar-popover-kicker">{{ t('folders.newFolder') }}</span>
            <form class="sidebar-popover-form" @submit.prevent="submitFolder">
              <InputText
                ref="folderInputRef"
                v-model="folderName"
                class="sidebar-popover-input"
                :placeholder="t('folders.namePlaceholder')"
                size="small"
              />
              <Button type="submit" icon="pi pi-check" size="small" :disabled="!folderName.trim()" />
            </form>
            <div class="sidebar-icon-grid">
              <button
                v-for="opt in iconOptions"
                :key="opt.value"
                type="button"
                class="sidebar-icon-option"
                :class="{ 'sidebar-icon-option-active': opt.value === folderIcon }"
                :title="opt.label"
                @click="folderIcon = opt.value"
              >
                <i :class="opt.value" />
              </button>
            </div>
          </div>
        </transition>
      </Teleport>

      <FolderList
        :show-home="false"
        :home-active="isHomeActive"
        :folders="folders"
        :active-folder-id="activeFolderId"
        :active-view="activeView"
        :special-views="specialViews"
        :collapsed="collapsed"
        @select-home="$emit('select-home')"
        @select="$emit('select-folder', $event)"
        @select-view="$emit('select-view', $event)"
        @update-folder="$emit('update-folder', $event)"
        @delete="$emit('delete-folder', $event)"
      />
    </div>

    <div v-if="!collapsed" class="sidebar-section sidebar-section-tags flex-1 min-h-0">
      <div class="section-header">
        <span>{{ t('sidebar.tags') }}</span>
        <div ref="tagPopoverAnchorRef" class="sidebar-popover-anchor">
          <Button
            icon="pi pi-plus"
            text
            rounded
            :aria-label="t('notes.newTag')"
            @click="togglePopover('tag')"
          />
        </div>

        <Teleport to="body">
          <transition name="sidebar-popover">
            <div
              v-if="activePopover === 'tag'"
              ref="tagPopoverRef"
              class="sidebar-popover"
              :style="popoverStyle"
              role="dialog"
              @click.stop
            >
              <span class="sidebar-popover-kicker">{{ t('notes.newTag') }}</span>
              <form class="sidebar-popover-form" @submit.prevent="submitTag">
                <InputText
                  ref="tagInputRef"
                  v-model="tagName"
                  class="sidebar-popover-input"
                  :placeholder="t('notes.newTagPlaceholder')"
                  size="small"
                />
                <Button type="submit" icon="pi pi-check" size="small" :disabled="!tagName.trim()" />
              </form>
              <div class="sidebar-tag-color-picker">
                <div class="sidebar-tag-color-header">
                  <span class="sidebar-tag-color-label">{{ t('notes.tagColor') }}</span>
                  <span class="sidebar-tag-color-value">{{ tagColor }}</span>
                </div>
                <div class="sidebar-tag-color-grid">
                  <button
                    v-for="color in tagColorOptions"
                    :key="color"
                    type="button"
                    class="sidebar-tag-color-swatch"
                    :class="{ 'sidebar-tag-color-swatch-active': color === tagColor }"
                    :style="{ '--sidebar-tag-color': color }"
                    :aria-label="`${t('notes.tagColor')}: ${color}`"
                    :title="color"
                    @click="tagColor = color"
                  />
                </div>
              </div>
            </div>
          </transition>
        </Teleport>
      </div>

      <TagList
        :tags="tags"
        :active-tag="activeTag"
        @select="$emit('select-tag', $event)"
        @create="openTagPopover"
        @delete="$emit('delete-tag', $event)"
      />
    </div>

    <div class="sidebar-footer" :class="{ 'sidebar-footer-collapsed-shell': collapsed }">
      <div v-if="!collapsed" class="sidebar-storage-card">
        <div class="sidebar-storage-header">
          <div>
            <div class="sidebar-storage-title">{{ t('storage.sidebarTitle') }}</div>
            <div class="sidebar-storage-caption">{{ storageDescription }}</div>
          </div>
          <div class="sidebar-storage-percent">{{ storagePercent }}%</div>
        </div>

        <Skeleton v-if="storageLoading" height="0.5rem" border-radius="999px" />
        <ProgressBar v-else :value="storagePercent" :show-value="false" class="sidebar-storage-progress" />
      </div>

      <template v-if="collapsed">
        <div class="sidebar-footer-collapsed">
          <Avatar
            v-if="user?.avatar"
            :image="user.avatar"
            shape="circle"
            size="large"
            class="sidebar-user-avatar"
            :title="userName"
          />
          <Avatar
            v-else
            :label="userInitial"
            shape="circle"
            size="large"
            class="sidebar-user-avatar"
            :title="userName"
          />

          <div class="sidebar-footer-actions sidebar-footer-actions-collapsed">
            <Button
              icon="pi pi-cog"
              text
              rounded
              size="small"
              :aria-label="t('sidebar.settings')"
              :title="t('sidebar.settings')"
              class="sidebar-footer-action"
              @click="$emit('open-settings')"
            />
            <Button
              icon="pi pi-sign-out"
              severity="secondary"
              text
              rounded
              size="small"
              :aria-label="t('sidebar.logout')"
              :title="t('sidebar.logout')"
              class="sidebar-footer-action"
              @click="$emit('logout')"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="sidebar-footer-row">
          <div class="sidebar-user-main">
            <Avatar
              v-if="user?.avatar"
              :image="user.avatar"
              shape="circle"
              size="large"
              class="sidebar-user-avatar"
            />
            <Avatar
              v-else
              :label="userInitial"
              shape="circle"
              size="large"
              class="sidebar-user-avatar"
            />

            <div class="min-w-0">
              <div class="user-name">{{ userName }}</div>
              <div class="user-email">{{ user?.email || '' }}</div>
            </div>
          </div>

          <div class="sidebar-footer-actions">
            <Button
              icon="pi pi-cog"
              text
              rounded
              size="small"
              :aria-label="t('sidebar.settings')"
              :title="t('sidebar.settings')"
              class="sidebar-footer-action"
              @click="$emit('open-settings')"
            />
            <Button
              icon="pi pi-sign-out"
              severity="secondary"
              text
              rounded
              size="small"
              :aria-label="t('sidebar.logout')"
              :title="t('sidebar.logout')"
              class="sidebar-footer-action"
              @click="$emit('logout')"
            />
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext';
import FolderList from '../folder/FolderList.vue';
import TagList from '../tag/TagList.vue';
import { getAvatarLabel } from '../../utils/avatar';

const props = defineProps({
  folders: {
    type: Array,
    default: () => [],
  },
  activeFolderId: {
    type: [String, Number, null],
    default: null,
  },
  homeActive: {
    type: Boolean,
    default: false,
  },
  activeView: {
    type: String,
    default: 'folder',
  },
  tags: {
    type: Array,
    default: () => [],
  },
  activeTag: {
    type: String,
    default: '',
  },
  hasSelectedNote: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  storageProfile: {
    type: Object,
    default: null,
  },
  storageLoading: {
    type: Boolean,
    default: false,
  },
  storagePercent: {
    type: Number,
    default: 0,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'select-home',
  'select-folder',
  'select-view',
  'select-tag',
  'create-folder',
  'update-folder',
  'delete-folder',
  'create-tag',
  'delete-tag',
  'open-settings',
  'logout',
]);

const { t } = useI18n();

const DEFAULT_FOLDER_ICON = 'pi pi-folder';
const DEFAULT_TAG_COLOR = '#14b8a6';
const TAG_COLOR_OPTIONS = [
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#64748b',
];

const activePopover = ref('');
const folderName = ref('');
const folderIcon = ref(DEFAULT_FOLDER_ICON);
const tagName = ref('');
const tagColor = ref(DEFAULT_TAG_COLOR);
const popoverStyle = ref({});
const folderPopoverAnchorRef = ref(null);
const tagPopoverAnchorRef = ref(null);
const folderPopoverRef = ref(null);
const tagPopoverRef = ref(null);
const folderInputRef = ref(null);
const tagInputRef = ref(null);
const tagColorOptions = TAG_COLOR_OPTIONS;

const iconOptions = computed(() => ([
  { value: 'pi pi-folder', label: t('folders.iconDefaultChoice') },
  { value: 'pi pi-folder-open', label: t('folders.iconProjectChoice') },
  { value: 'pi pi-briefcase', label: t('folders.iconWorkChoice') },
  { value: 'pi pi-book', label: t('folders.iconStudyChoice') },
  { value: 'pi pi-code', label: t('folders.iconCodeChoice') },
  { value: 'pi pi-database', label: t('folders.iconDatabaseChoice') },
  { value: 'pi pi-cloud', label: t('folders.iconCloudChoice') },
  { value: 'pi pi-inbox', label: t('folders.iconInboxChoice') },
  { value: 'pi pi-bookmark', label: t('folders.iconBookmarkChoice') },
  { value: 'pi pi-images', label: t('folders.iconMediaChoice') },
  { value: 'pi pi-lock', label: t('folders.iconPrivateChoice') },
  { value: 'pi pi-box', label: t('folders.iconArchiveChoice') },
]));

function calcPopoverPosition(anchorEl) {
  if (!anchorEl) return {};
  const rect = anchorEl.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${Math.max(8, rect.right - 260)}px`,
    zIndex: 9999,
  };
}

function openFolderPopover() {
  popoverStyle.value = calcPopoverPosition(folderPopoverAnchorRef.value);
  activePopover.value = 'folder';
  folderName.value = '';
  folderIcon.value = DEFAULT_FOLDER_ICON;
  nextTick(() => folderInputRef.value?.$el?.focus());
}

function openTagPopover() {
  popoverStyle.value = calcPopoverPosition(tagPopoverAnchorRef.value);
  activePopover.value = 'tag';
  tagName.value = '';
  tagColor.value = DEFAULT_TAG_COLOR;
  nextTick(() => tagInputRef.value?.$el?.focus());
}

function togglePopover(name) {
  if (activePopover.value === name) {
    activePopover.value = '';
    return;
  }

  if (name === 'folder') {
    openFolderPopover();
    return;
  }

  openTagPopover();
}

function closePopover() {
  activePopover.value = '';
}

function submitFolder() {
  const name = folderName.value.trim();
  if (!name) return;
  emit('create-folder', { name, icon: folderIcon.value || DEFAULT_FOLDER_ICON });
  closePopover();
}

function submitTag() {
  const name = tagName.value.trim();
  if (!name) return;
  emit('create-tag', { name, color: tagColor.value || DEFAULT_TAG_COLOR });
  closePopover();
}

function handlePointerDown(event) {
  if (!activePopover.value) return;
  const anchor = activePopover.value === 'folder' ? folderPopoverAnchorRef.value : tagPopoverAnchorRef.value;
  if (anchor instanceof HTMLElement && anchor.contains(event.target)) return;
  const popover = activePopover.value === 'folder' ? folderPopoverRef.value : tagPopoverRef.value;
  if (popover instanceof HTMLElement && popover.contains(event.target)) return;
  closePopover();
}

function handleEscape(event) {
  if (event.key === 'Escape') closePopover();
}

onMounted(() => {
  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('keydown', handleEscape);
});
const isHomeActive = computed(() => props.homeActive);
const specialViews = computed(() => ([
  {
    id: 'starred',
    name: t('sidebar.starred'),
    icon: 'pi pi-star',
    noteCount: null,
  },
  {
    id: 'trash',
    name: t('sidebar.trash'),
    icon: 'pi pi-trash',
    tone: 'danger',
    noteCount: null,
  },
]));

const userName = computed(() => props.user?.nickname || props.user?.email || t('app.name'));
const userInitial = computed(() => getAvatarLabel(userName.value));
const storagePercent = computed(() => Math.max(0, Math.min(100, Number(props.storagePercent || 0))));
const storageDescription = computed(() => {
  if (!props.storageProfile?.storageLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(props.storageProfile.storageUsed),
    limit: formatBytes(props.storageProfile.storageLimit),
  });
});

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = numericValue;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
</script>

<style scoped>
.panel {
  height: 100%;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: auto;
}

.sidebar-panel {
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overscroll-behavior: contain;
}

.sidebar-panel-collapsed {
  align-items: stretch;
}

.sidebar-brand-card {
  padding: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
}

.sidebar-brand-card-collapsed {
  padding: 1rem 0.75rem;
}

.sidebar-brand-row,
.sidebar-collapsed-stack {
  display: flex;
  align-items: center;
}

.sidebar-brand-row {
  gap: 0.75rem;
}

.sidebar-collapsed-stack {
  justify-content: center;
}

.sidebar-search-card {
  padding: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.sidebar-section-collapsed {
  gap: 0.55rem;
}

.sidebar-brand {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.section-header,
.sidebar-theme-label {
  font-family: var(--font-mono);
}

.sidebar-home-button,
.sidebar-home-copy {
  display: flex;
}

.sidebar-home-button {
  width: 100%;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 14%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-subtle) 98%, transparent));
  color: var(--text-color);
  text-align: left;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}

.sidebar-home-button:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  box-shadow: 0 16px 24px -24px color-mix(in srgb, var(--primary-color) 44%, transparent);
}

.sidebar-home-button-active {
  border-color: color-mix(in srgb, var(--primary-color) 46%, var(--app-border));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 20%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-subtle) 98%, transparent));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 14%, transparent);
}

.sidebar-home-button-collapsed {
  justify-content: center;
  padding: 0.8rem 0.45rem;
}

.sidebar-home-icon {
  width: 2.3rem;
  height: 2.3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
}

.sidebar-home-copy {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.12rem;
}

.sidebar-home-label,
.sidebar-home-hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-home-label {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sidebar-home-hint,
.sidebar-home-arrow {
  color: var(--text-color-secondary);
}

.sidebar-home-hint {
  font-size: 0.8rem;
}

.sidebar-home-arrow {
  flex-shrink: 0;
}

.sidebar-subtitle,
.user-email {
  color: var(--text-color-secondary);
}

.sidebar-subtitle,
.user-email {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-section + .sidebar-section,
.sidebar-footer {
  border-top: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
}

.sidebar-storage-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  margin-bottom: 0.9rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 84%, var(--primary-color));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 94%, transparent);
}

.sidebar-storage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar-storage-title,
.sidebar-storage-percent {
  font-family: var(--font-mono);
}

.sidebar-storage-title {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-color);
}

.sidebar-storage-caption {
  margin-top: 0.3rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
}

.sidebar-storage-percent {
  flex-shrink: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-color);
}

.sidebar-storage-progress {
  height: 0.5rem;
}

.sidebar-storage-progress :deep(.p-progressbar) {
  height: 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 92%, transparent);
}

.sidebar-storage-progress :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary-color) 82%, var(--app-support)), var(--app-support));
}

.sidebar-footer-collapsed-shell {
  padding-top: 0.85rem;
}

.sidebar-footer-row,
.sidebar-user-main,
.sidebar-footer-actions {
  display: flex;
  align-items: center;
}

.sidebar-footer-row {
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar-user-main {
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.sidebar-user-avatar {
  flex: 0 0 3rem;
}

.sidebar-user-avatar:deep(.p-avatar) {
  width: 3rem;
  height: 3rem;
  min-width: 3rem;
  min-height: 3rem;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  flex-shrink: 0;
}

.sidebar-user-avatar:deep(.p-avatar img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
}

.sidebar-footer-actions {
  gap: 0.25rem;
  flex-shrink: 0;
}

.sidebar-footer-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.sidebar-footer-actions-collapsed {
  flex-direction: column;
}

.sidebar-footer-action {
  width: 2.25rem;
  height: 2.25rem;
}

.user-name {
  font-weight: 700;
}

.sidebar-popover-anchor {
  position: relative;
  display: inline-flex;
}


@media (max-width: 1180px) {
  .sidebar-panel {
    padding-right: 1rem;
  }
}
</style>

<style>
.sidebar-popover {
  position: fixed;
  z-index: 9999;
  width: min(16rem, calc(100vw - 2rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 22%, var(--panel-section-border, var(--surface-border)));
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
  box-shadow: var(--app-shadow-soft);
}

.sidebar-popover-folder {
  width: min(18rem, calc(100vw - 2rem));
}

.sidebar-popover-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 1.2rem;
  margin-bottom: 0.4rem;
  color: var(--primary-color);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-popover-form {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sidebar-popover-input {
  flex: 1;
  min-width: 0;
}

.sidebar-tag-color-picker {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.8rem;
}

.sidebar-tag-color-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar-tag-color-label,
.sidebar-tag-color-value {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sidebar-tag-color-label {
  color: var(--text-color-secondary);
}

.sidebar-tag-color-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
}

.sidebar-tag-color-swatch {
  --sidebar-tag-color: var(--primary-color);
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--sidebar-tag-color) 38%, var(--surface-border));
  border-radius: 0.55rem;
  background:
    radial-gradient(circle at 30% 30%, color-mix(in srgb, white 28%, var(--sidebar-tag-color)), var(--sidebar-tag-color));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, white 8%, transparent);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.sidebar-tag-color-swatch:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--sidebar-tag-color) 56%, var(--surface-border));
}

.sidebar-tag-color-swatch-active {
  transform: translateY(-1px) scale(1.03);
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, white 44%, transparent),
    inset 0 0 0 4px color-mix(in srgb, var(--sidebar-tag-color) 82%, black 6%),
    0 0 0 2px color-mix(in srgb, var(--sidebar-tag-color) 22%, transparent);
}

.sidebar-tag-color-value {
  color: var(--primary-color);
}

.sidebar-icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.3rem;
  margin-top: 0.55rem;
}

.sidebar-icon-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--surface-border) 80%, transparent);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.sidebar-icon-option:hover {
  border-color: color-mix(in srgb, var(--primary-color) 36%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-inset));
  color: var(--primary-color);
}

.sidebar-icon-option-active {
  border-color: color-mix(in srgb, var(--primary-color) 50%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
}

.sidebar-popover-enter-active,
.sidebar-popover-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.sidebar-popover-enter-from,
.sidebar-popover-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}
</style>
