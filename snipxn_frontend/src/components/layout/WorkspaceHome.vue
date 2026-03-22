<template>
  <section class="panel editor-panel workspace-home">
    <div class="workspace-home-shell">
      <section class="workspace-home-hero">
        <div class="workspace-home-kicker">{{ t('workspace.homeKicker') }}</div>
        <div class="workspace-home-heading">
          <h2 class="workspace-home-title">{{ t('workspace.homeTitle') }}</h2>
          <p class="workspace-home-body">{{ t('workspace.homeBody') }}</p>
        </div>

        <div class="workspace-home-user">
          <span class="workspace-home-user-label">{{ t('settings.profile') }}</span>
          <strong class="workspace-home-user-name">{{ userName }}</strong>
        </div>

        <div class="workspace-home-actions">
          <Button icon="pi pi-plus" :label="t('notes.newNote')" @click="$emit('create-note')" />
          <Button icon="pi pi-folder-plus" severity="secondary" outlined :label="t('sidebar.createFolder')" @click="$emit('create-folder')" />
          <Button icon="pi pi-users" severity="secondary" outlined :label="t('community.title')" @click="$emit('open-community')" />
          <Button icon="pi pi-cog" severity="secondary" outlined :label="t('settings.title')" @click="$emit('open-settings')" />
        </div>
      </section>

      <section class="workspace-home-overview">
        <article v-for="item in metrics" :key="item.id" class="workspace-home-metric-card">
          <span class="workspace-home-metric-label">{{ item.label }}</span>
          <strong class="workspace-home-metric-value">{{ item.value }}</strong>
        </article>

        <article class="workspace-home-storage-card">
          <div class="workspace-home-storage-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('storage.sidebarTitle') }}</span>
              <strong class="workspace-home-storage-copy">{{ storageDescription }}</strong>
            </div>
            <strong class="workspace-home-storage-percent">{{ storagePercent }}%</strong>
          </div>
          <ProgressBar :value="storagePercent" :show-value="false" />
        </article>

        <article class="workspace-home-scope-card">
          <span class="workspace-home-section-kicker">{{ t('workspace.homeCurrentScope') }}</span>
          <strong class="workspace-home-scope-value">{{ activeFolderName }}</strong>
          <span class="workspace-home-scope-hint">{{ t('notes.scopeFolder', { name: activeFolderName }) }}</span>
        </article>
      </section>

      <div class="workspace-home-content">
        <section class="workspace-home-panel">
          <div class="workspace-home-panel-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('workspace.homeRecentNotes') }}</span>
              <h3 class="workspace-home-panel-title">{{ t('workspace.homeRecentNotes') }}</h3>
            </div>
          </div>

          <div v-if="recentNotes.length" class="workspace-home-recent-list">
            <button
              v-for="note in recentNotes"
              :key="note.id"
              type="button"
              class="workspace-home-recent-item"
              @click="$emit('open-note', note.id)"
            >
              <div class="workspace-home-recent-main">
                <strong class="workspace-home-recent-title">{{ note.title || t('notes.untitled') }}</strong>
                <span class="workspace-home-recent-summary">{{ note.summary || t('notes.emptySummary') }}</span>
              </div>
              <div class="workspace-home-recent-meta">
                <span>{{ note.primaryLanguage || 'Markdown' }}</span>
                <span>{{ formatTime(note.updatedAt || note.createdAt) }}</span>
              </div>
            </button>
          </div>
          <div v-else class="workspace-home-empty">
            <i class="pi pi-file-edit workspace-home-empty-icon" aria-hidden="true" />
            <p class="workspace-home-empty-copy">{{ t('workspace.homeRecentNotesEmpty') }}</p>
          </div>
        </section>

        <section class="workspace-home-panel">
          <div class="workspace-home-panel-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('workspace.homeFolders') }}</span>
              <h3 class="workspace-home-panel-title">{{ t('workspace.homeFolders') }}</h3>
            </div>
          </div>

          <div v-if="folders.length" class="workspace-home-folder-list">
            <article v-for="folder in folders.slice(0, 6)" :key="folder.id" class="workspace-home-folder-item">
              <span class="workspace-home-folder-icon">
                <i :class="folder.icon || 'pi pi-folder'" />
              </span>
              <div class="workspace-home-folder-copy">
                <strong>{{ folder.name }}</strong>
                <span>{{ folder.isDefault ? t('folders.defaultFolder') : t('sidebar.folders') }}</span>
              </div>
            </article>
          </div>
          <div v-else class="workspace-home-empty">
            <i class="pi pi-folder workspace-home-empty-icon" aria-hidden="true" />
            <p class="workspace-home-empty-copy">{{ t('workspace.homeFoldersEmpty') }}</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  recentNotes: {
    type: Array,
    default: () => [],
  },
  folders: {
    type: Array,
    default: () => [],
  },
  metrics: {
    type: Array,
    default: () => [],
  },
  storageProfile: {
    type: Object,
    default: null,
  },
  storagePercent: {
    type: Number,
    default: 0,
  },
  activeFolderName: {
    type: String,
    default: '',
  },
});

defineEmits(['create-note', 'create-folder', 'open-community', 'open-settings', 'open-note']);

const { locale, t } = useI18n();

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = numericValue;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const userName = computed(() => (
  props.user?.nickname
  || props.user?.email
  || t('app.name')
));
const storageDescription = computed(() => {
  if (!props.storageProfile?.storageLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(props.storageProfile.storageUsed),
    limit: formatBytes(props.storageProfile.storageLimit),
  });
});
</script>

<style scoped>
.workspace-home {
  display: flex;
  min-height: 100%;
  background: transparent;
}

.workspace-home-shell {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.95fr);
  gap: 1rem;
  align-content: start;
}

.workspace-home-hero,
.workspace-home-metric-card,
.workspace-home-storage-card,
.workspace-home-scope-card,
.workspace-home-panel {
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.workspace-home-hero {
  padding: 1.2rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 98%, transparent));
}

.workspace-home-kicker,
.workspace-home-section-kicker,
.workspace-home-user-label,
.workspace-home-metric-label,
.workspace-home-recent-meta,
.workspace-home-folder-copy span {
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.workspace-home-kicker,
.workspace-home-section-kicker {
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.workspace-home-heading {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.workspace-home-title,
.workspace-home-panel-title {
  margin: 0;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.workspace-home-title {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  line-height: 1.05;
}

.workspace-home-body,
.workspace-home-empty-copy,
.workspace-home-recent-summary,
.workspace-home-folder-copy span,
.workspace-home-scope-hint {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.workspace-home-user {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.workspace-home-user-name,
.workspace-home-metric-value,
.workspace-home-storage-copy,
.workspace-home-scope-value,
.workspace-home-recent-title,
.workspace-home-folder-copy strong {
  color: var(--text-color);
}

.workspace-home-user-name,
.workspace-home-storage-copy,
.workspace-home-scope-value {
  font-size: 1rem;
  font-weight: 700;
}

.workspace-home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.workspace-home-overview {
  display: grid;
  gap: 1rem;
}

.workspace-home-metric-card,
.workspace-home-storage-card,
.workspace-home-scope-card,
.workspace-home-panel {
  padding: 1rem;
}

.workspace-home-metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.workspace-home-metric-label,
.workspace-home-user-label,
.workspace-home-recent-meta,
.workspace-home-folder-copy span,
.workspace-home-scope-hint {
  color: var(--text-color-secondary);
}

.workspace-home-storage-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.workspace-home-storage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.workspace-home-storage-percent {
  color: var(--primary-color);
  font-size: 1.2rem;
  line-height: 1;
}

.workspace-home-content {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
  gap: 1rem;
}

.workspace-home-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.workspace-home-recent-list,
.workspace-home-folder-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.workspace-home-recent-item {
  width: 100%;
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.workspace-home-recent-item:hover {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 5%, var(--app-panel-strong));
}

.workspace-home-recent-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.workspace-home-recent-title {
  line-height: 1.4;
}

.workspace-home-recent-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workspace-home-recent-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: right;
}

.workspace-home-folder-item {
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.workspace-home-folder-icon {
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-strong));
  color: var(--primary-color);
  flex-shrink: 0;
}

.workspace-home-folder-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.workspace-home-empty {
  min-height: 11rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-subtle) 86%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  text-align: center;
  padding: 1rem;
}

.workspace-home-empty-icon {
  color: var(--primary-color);
  font-size: 1.2rem;
}

@media (max-width: 1120px) {
  .workspace-home-shell,
  .workspace-home-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .workspace-home-actions,
  .workspace-home-recent-item {
    flex-direction: column;
  }

  .workspace-home-recent-meta {
    width: 100%;
    text-align: left;
  }
}
</style>
