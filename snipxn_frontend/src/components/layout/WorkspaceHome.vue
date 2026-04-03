<template>
  <section class="panel editor-panel workspace-home">
    <div class="workspace-home-shell">
      <section class="workspace-home-hero">
        <div class="workspace-home-hero-copy">
          <div class="workspace-home-kicker">{{ t('workspace.homeKicker') }}</div>
          <div class="workspace-home-heading">
            <h2 class="workspace-home-title">{{ t('workspace.homeTitle') }}</h2>
          </div>

          <div class="workspace-home-hero-meta">
            <span class="workspace-home-chip">{{ t('workspace.homeCurrentScope') }} · {{ activeFolderName }}</span>
            <span class="workspace-home-chip">{{ latestUpdateDescription }}</span>
          </div>
        </div>

        <div class="workspace-home-hero-actions">
          <Button icon="pi pi-plus" :label="t('notes.newNoteAction')" @click="emitIfNoSelection('create-note')" />
          <Button
            :icon="latestNote ? 'pi pi-history' : 'pi pi-folder-plus'"
            severity="secondary"
            outlined
            :label="latestNote ? t('workspace.homeResumeLatest') : t('sidebar.createFolder')"
            @click="handleSecondaryAction"
          />
        </div>
      </section>

      <div class="workspace-home-grid">
        <section class="workspace-home-panel workspace-home-panel-main">
          <div class="workspace-home-panel-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('workspace.homeRecentNotes') }}</span>
              <h3 class="workspace-home-panel-title">{{ t('workspace.homeRecentNotes') }}</h3>
            </div>
          </div>

          <template v-if="latestNote">
            <button
              type="button"
              class="workspace-home-featured-note"
              @click="emitIfNoSelection('open-note', latestNote.id)"
            >
              <span class="workspace-home-featured-kicker">{{ t('workspace.homeLatestUpdate') }}</span>
              <strong class="workspace-home-featured-title">{{ latestNoteTitle }}</strong>
              <p class="workspace-home-featured-summary">{{ latestNoteSummary }}</p>
              <div class="workspace-home-featured-meta">
                <span>{{ latestNote.primaryLanguage || 'Markdown' }}</span>
                <span>{{ latestNoteTime }}</span>
              </div>
            </button>

            <div v-if="secondaryRecentNotes.length" class="workspace-home-recent-list">
              <button
                v-for="note in secondaryRecentNotes"
                :key="note.id"
                type="button"
                class="workspace-home-recent-item"
                @click="emitIfNoSelection('open-note', note.id)"
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
          </template>

          <div v-else class="workspace-home-empty">
            <i class="pi pi-file-edit workspace-home-empty-icon" aria-hidden="true" />
            <p class="workspace-home-empty-copy">{{ t('workspace.homeRecentNotesEmpty') }}</p>
          </div>
        </section>

        <div class="workspace-home-side-column">
          <section class="workspace-home-panel">
            <div class="workspace-home-panel-header">
              <div>
                <span class="workspace-home-section-kicker">{{ t('workspace.homeQuickStart') }}</span>
                <h3 class="workspace-home-panel-title">{{ t('workspace.homeQuickStart') }}</h3>
              </div>
            </div>

            <div class="workspace-home-action-list">
              <button type="button" class="workspace-home-action" @click="emitIfNoSelection('create-note')">
                <span class="workspace-home-action-icon"><i class="pi pi-file-edit" aria-hidden="true" /></span>
                <span class="workspace-home-action-copy">
                  <strong>{{ t('notes.newNoteAction') }}</strong>
                  <span>{{ t('workspace.homeShortcutNote') }}</span>
                </span>
              </button>

              <button type="button" class="workspace-home-action" @click="emitIfNoSelection('create-folder')">
                <span class="workspace-home-action-icon"><i class="pi pi-folder-open" aria-hidden="true" /></span>
                <span class="workspace-home-action-copy">
                  <strong>{{ t('sidebar.createFolder') }}</strong>
                  <span>{{ t('workspace.homeShortcutFolder') }}</span>
                </span>
              </button>
            </div>
          </section>

          <section class="workspace-home-panel">
            <div class="workspace-home-panel-header">
              <div>
                <span class="workspace-home-section-kicker">{{ t('workspace.homeSnapshot') }}</span>
                <h3 class="workspace-home-panel-title">{{ t('workspace.homeSnapshot') }}</h3>
              </div>
            </div>

            <div class="workspace-home-identity">
              <span class="workspace-home-user-label">{{ t('settings.profile') }}</span>
              <strong class="workspace-home-user-name">{{ userName }}</strong>
            </div>

            <div class="workspace-home-context-list">
              <div class="workspace-home-context-row">
                <span>{{ t('workspace.homeCurrentScope') }}</span>
                <strong>{{ activeFolderName }}</strong>
              </div>
              <div class="workspace-home-context-row">
                <span>{{ t('workspace.homeLatestUpdate') }}</span>
                <strong>{{ latestNoteTime }}</strong>
              </div>
            </div>

            <div class="workspace-home-storage-block">
              <div class="workspace-home-storage-header">
                <span class="workspace-home-storage-label">{{ t('storage.sidebarTitle') }}</span>
                <strong class="workspace-home-storage-percent">{{ storagePercent }}%</strong>
              </div>
              <strong class="workspace-home-storage-copy">{{ storageDescription }}</strong>
              <ProgressBar :value="storagePercent" :show-value="false" />
            </div>

            <div class="workspace-home-metrics">
              <article v-for="item in metrics" :key="item.id" class="workspace-home-metric">
                <span class="workspace-home-metric-label">{{ item.label }}</span>
                <strong class="workspace-home-metric-value">{{ item.value }}</strong>
              </article>
            </div>
          </section>
        </div>
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

const emit = defineEmits(['create-note', 'create-folder', 'open-community', 'open-settings', 'open-note']);
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

function hasActiveTextSelection() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.getSelection?.()?.toString().trim());
}

function emitIfNoSelection(eventName, ...args) {
  if (hasActiveTextSelection()) {
    return;
  }

  emit(eventName, ...args);
}

function handleSecondaryAction() {
  if (latestNote.value?.id) {
    emitIfNoSelection('open-note', latestNote.value.id);
    return;
  }

  emitIfNoSelection('create-folder');
}

const userName = computed(() => props.user?.nickname || props.user?.email || t('app.name'));
const latestNote = computed(() => props.recentNotes[0] || null);
const secondaryRecentNotes = computed(() => props.recentNotes.slice(1, 5));
const latestNoteTitle = computed(() => latestNote.value?.title || t('workspace.homeLatestUpdateEmpty'));
const latestNoteTime = computed(() => (
  latestNote.value ? formatTime(latestNote.value.updatedAt || latestNote.value.createdAt) : t('workspace.homeLatestUpdateEmpty')
));
const latestNoteSummary = computed(() => latestNote.value?.summary || t('notes.emptySummary'));
const latestUpdateDescription = computed(() => (
  latestNote.value
    ? `${t('workspace.homeLatestUpdate')} · ${formatTime(latestNote.value.updatedAt || latestNote.value.createdAt)}`
    : t('workspace.homeLatestUpdateEmpty')
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
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  display: flex;
  background: transparent;
}

.workspace-home-shell {
  width: 100%;
  min-width: 0;
  padding: 1.2rem;
  display: grid;
  gap: 0.8rem;
}

.workspace-home-hero,
.workspace-home-panel,
.workspace-home-featured-note,
.workspace-home-recent-item,
.workspace-home-action,
.workspace-home-identity,
.workspace-home-storage-block,
.workspace-home-metric,
.workspace-home-chip {
  border: 1px solid var(--app-border);
}

.workspace-home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) auto;
  gap: 0.9rem;
  align-items: end;
  padding: 1rem 1.05rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 98%, transparent));
}

.workspace-home-hero-copy,
.workspace-home-heading,
.workspace-home-panel,
.workspace-home-side-column,
.workspace-home-action-copy,
.workspace-home-recent-main {
  display: flex;
  flex-direction: column;
}

.workspace-home-hero-copy,
.workspace-home-panel {
  gap: 0.75rem;
}

.workspace-home-heading {
  gap: 0.42rem;
}

.workspace-home-kicker,
.workspace-home-section-kicker,
.workspace-home-featured-kicker,
.workspace-home-user-label,
.workspace-home-metric-label,
.workspace-home-storage-label {
  color: var(--primary-color);
  font-family: var(--font-mono);
  font-size: 0.77rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workspace-home-title,
.workspace-home-panel-title,
.workspace-home-featured-title,
.workspace-home-user-name,
.workspace-home-metric-value,
.workspace-home-storage-copy,
.workspace-home-context-row strong,
.workspace-home-recent-title,
.workspace-home-action-copy strong {
  color: var(--text-color);
}

.workspace-home-title,
.workspace-home-panel-title {
  margin: 0;
  letter-spacing: -0.04em;
}

.workspace-home-title {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.02;
}

.workspace-home-body,
.workspace-home-panel-body,
.workspace-home-featured-summary,
.workspace-home-recent-summary,
.workspace-home-empty-copy,
.workspace-home-context-row span,
.workspace-home-action-copy span {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.workspace-home-body,
.workspace-home-panel-body {
  max-width: 42rem;
}

.workspace-home-hero-meta,
.workspace-home-featured-meta,
.workspace-home-hero-actions,
.workspace-home-storage-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.workspace-home-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0 0.65rem;
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.78rem;
}

.workspace-home-hero-actions {
  justify-content: flex-end;
}

.workspace-home-hero-actions :deep(.p-button) {
  min-height: 2.55rem;
}

.workspace-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18.75rem, 0.95fr);
  gap: 0.8rem;
  min-width: 0;
}

.workspace-home-side-column {
  gap: 0.8rem;
}

.workspace-home-panel {
  min-width: 0;
  padding: 0.95rem;
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.workspace-home-panel-main {
  min-height: 0;
}

.workspace-home-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.workspace-home-featured-note,
.workspace-home-recent-item,
.workspace-home-action {
  width: 100%;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.workspace-home-featured-note:hover,
.workspace-home-recent-item:hover,
.workspace-home-action:hover {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--app-border));
  transform: translateY(-1px);
}

.workspace-home-featured-note {
  padding: 1rem;
  display: grid;
  gap: 0.45rem;
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
}

.workspace-home-featured-title {
  font-size: 1.08rem;
  line-height: 1.3;
}

.workspace-home-featured-summary {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.workspace-home-featured-meta,
.workspace-home-recent-meta {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.77rem;
}

.workspace-home-recent-list,
.workspace-home-action-list,
.workspace-home-context-list,
.workspace-home-metrics {
  display: grid;
  gap: 0.65rem;
}

.workspace-home-recent-item,
.workspace-home-action {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.82rem 0.85rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-home-recent-main,
.workspace-home-action-copy {
  min-width: 0;
  gap: 0.18rem;
  flex: 1;
}

.workspace-home-recent-summary,
.workspace-home-action-copy span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.workspace-home-recent-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
  text-align: right;
}

.workspace-home-action-icon {
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  color: var(--primary-color);
}

.workspace-home-identity,
.workspace-home-storage-block,
.workspace-home-metric {
  padding: 0.8rem 0.85rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-home-identity {
  display: grid;
  gap: 0.25rem;
}

.workspace-home-context-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  min-width: 0;
}

.workspace-home-context-row strong {
  min-width: 0;
  text-align: right;
}

.workspace-home-storage-block {
  display: grid;
  gap: 0.6rem;
}

.workspace-home-storage-header {
  justify-content: space-between;
}

.workspace-home-storage-percent {
  color: var(--primary-color);
  line-height: 1;
}

.workspace-home-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.workspace-home-metric {
  display: grid;
  gap: 0.2rem;
}

.workspace-home-metric-label {
  color: var(--text-color-secondary);
}

.workspace-home-empty {
  min-height: 16rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: 1px dashed var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 90%, transparent);
}

.workspace-home-empty-icon {
  font-size: 1.45rem;
  color: var(--primary-color);
}

@media (max-width: 1180px) {
  .workspace-home-hero,
  .workspace-home-grid {
    grid-template-columns: 1fr;
  }

  .workspace-home-hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .workspace-home-shell {
    padding: 1rem;
  }

  .workspace-home-metrics {
    grid-template-columns: 1fr;
  }

  .workspace-home-recent-item {
    flex-direction: column;
  }

  .workspace-home-recent-meta {
    align-items: flex-start;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .workspace-home-title {
    font-size: clamp(1.7rem, 10vw, 2.25rem);
  }

  .workspace-home-hero,
  .workspace-home-panel,
  .workspace-home-featured-note,
  .workspace-home-recent-item,
  .workspace-home-action,
  .workspace-home-identity,
  .workspace-home-storage-block,
  .workspace-home-metric {
    padding: 0.9rem;
  }

  .workspace-home-hero-actions :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
