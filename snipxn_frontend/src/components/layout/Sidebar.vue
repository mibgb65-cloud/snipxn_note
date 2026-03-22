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
            @click="$emit('create-folder')"
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
      <div v-if="!collapsed" class="section-header">
        <span>{{ t('sidebar.folders') }}</span>
        <Button
          icon="pi pi-plus"
          text
          rounded
          :aria-label="t('sidebar.createFolder')"
          @click="$emit('create-folder')"
        />
      </div>

      <FolderList
        :show-home="true"
        :home-active="activeView === 'folder' && !hasSelectedNote"
        :folders="folders"
        :active-folder-id="activeFolderId"
        :active-view="activeView"
        :special-views="specialViews"
        :collapsed="collapsed"
        @select-home="$emit('select-home')"
        @select="$emit('select-folder', $event)"
        @select-view="$emit('select-view', $event)"
        @edit="$emit('edit-folder', $event)"
        @delete="$emit('delete-folder', $event)"
      />
    </div>

    <div v-if="!collapsed" class="sidebar-section sidebar-section-tags flex-1 min-h-0">
      <div class="section-header">
        <span>{{ t('sidebar.tags') }}</span>
        <Button
          icon="pi pi-plus"
          text
          rounded
          :aria-label="t('notes.newTag')"
          @click="$emit('create-tag')"
        />
      </div>

      <TagList
        :tags="tags"
        :active-tag="activeTag"
        @select="$emit('select-tag', $event)"
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
            :title="userName"
          />
          <Avatar
            v-else
            :label="userInitial"
            shape="circle"
            size="large"
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
            />
            <Avatar
              v-else
              :label="userInitial"
              shape="circle"
              size="large"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import FolderList from '../folder/FolderList.vue';
import TagList from '../tag/TagList.vue';

const props = defineProps({
  folders: {
    type: Array,
    default: () => [],
  },
  activeFolderId: {
    type: [String, Number, null],
    default: null,
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

defineEmits([
  'select-home',
  'select-folder',
  'select-view',
  'select-tag',
  'create-folder',
  'edit-folder',
  'delete-folder',
  'create-tag',
  'open-settings',
  'logout',
]);

const { t } = useI18n();
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
const userInitial = computed(() => String(userName.value).slice(0, 1).toUpperCase());
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
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary-color) 92%, white), var(--primary-color));
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

@media (max-width: 1180px) {
  .sidebar-panel {
    padding-right: 1rem;
  }
}
</style>
