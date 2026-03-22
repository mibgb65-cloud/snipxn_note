<template>
  <div class="toolbar-card">
    <div class="toolbar-header">
      <div class="toolbar-title-stack">
        <div
          class="toolbar-sync-status"
          :class="{
            'toolbar-sync-status-saving': syncStatus === 'saving',
            'toolbar-sync-status-pending': syncStatus === 'pending',
          }"
        >
          <i class="pi toolbar-sync-icon" :class="syncStatusIcon" aria-hidden="true" />
          <span>{{ syncStatusLabel }}</span>
        </div>

        <InputText
          id="note-title"
          :model-value="note?.title || ''"
          class="toolbar-title-input"
          :placeholder="t('notes.titlePlaceholder')"
          @update:model-value="$emit('update:title', $event)"
        />
      </div>

      <div class="toolbar-inline-strip">
        <div class="toolbar-language-shell">
          <span class="toolbar-inline-label">{{ t('notes.language') }}</span>
          <InputText
            id="note-language"
            :model-value="note?.primaryLanguage || ''"
            class="toolbar-language-input"
            :placeholder="t('notes.languagePlaceholder')"
            @update:model-value="$emit('update:language', $event)"
          />
        </div>

        <span class="toolbar-meta-item">
          {{ t('notes.versionValue', { version: note?.version ?? 1 }) }}
        </span>

        <span v-if="formattedUpdatedAt" class="toolbar-meta-item">
          {{ t('notes.updatedAtValue', { time: formattedUpdatedAt }) }}
        </span>
      </div>
    </div>

    <div class="toolbar-actions">
      <div class="toolbar-actions-main">
        <div class="toolbar-action-group">
          <Button
            :icon="note?.isStarred ? 'pi pi-star-fill' : 'pi pi-star'"
            text
            rounded
            :disabled="saving"
            @click="$emit('toggle-star')"
          />
          <Button
            icon="pi pi-image"
            text
            rounded
            :disabled="saving || isTrashView"
            :aria-label="t('notes.uploadImage')"
            @click="$emit('upload-image')"
          />
          <div class="toolbar-markdown-actions">
            <Button
              v-for="action in markdownActions"
              :key="action.key"
              :icon="action.icon"
              text
              rounded
              size="small"
              :disabled="saving || isTrashView"
              :aria-label="action.label"
              :title="action.label"
              @click="$emit('insert-markdown', action.key)"
            />
          </div>
        </div>

        <div class="toolbar-editor-hint">
          <i class="pi pi-image" aria-hidden="true" />
          <span>{{ t('notes.editorHint') }}</span>
        </div>

        <div class="toolbar-action-group toolbar-action-group-trailing">
          <template v-if="!isTrashView">
            <Button
              icon="pi pi-send"
              severity="secondary"
              outlined
              :label="t('notes.shareNote')"
              class="toolbar-inline-action"
              :disabled="saving"
              @click="$emit('share-note')"
            />
            <div ref="confirmAnchorRef" class="toolbar-confirm-anchor">
              <Button
                icon="pi pi-trash"
                severity="danger"
                outlined
                :label="t('common.delete')"
                class="toolbar-inline-action toolbar-inline-action-danger"
                :disabled="saving"
                @click="toggleConfirm('delete')"
              />

              <transition name="toolbar-confirm">
                <div
                  v-if="confirmAction"
                  class="toolbar-confirm-popover"
                  role="dialog"
                  aria-live="polite"
                >
                  <span class="toolbar-confirm-kicker">
                    {{ confirmAction === 'purge' ? t('notes.purgeAction') : t('common.delete') }}
                  </span>
                  <p class="toolbar-confirm-message">
                    {{ confirmAction === 'purge' ? t('notes.purgeConfirm') : t('notes.deleteConfirm') }}
                  </p>
                  <div class="toolbar-confirm-actions">
                    <Button
                      type="button"
                      size="small"
                      severity="secondary"
                      text
                      :label="t('common.cancel')"
                      @click="closeConfirm"
                    />
                    <Button
                      type="button"
                      size="small"
                      severity="danger"
                      :label="confirmAction === 'purge' ? t('notes.purgeAction') : t('common.delete')"
                      @click="confirmCurrentAction"
                    />
                  </div>
                </div>
              </transition>
            </div>
          </template>
          <template v-else>
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :label="t('notes.restoreAction')"
              class="toolbar-inline-action"
              :disabled="saving"
              @click="$emit('restore')"
            />
            <div ref="confirmAnchorRef" class="toolbar-confirm-anchor">
              <Button
                icon="pi pi-times"
                severity="danger"
                outlined
                :label="t('notes.purgeAction')"
                class="toolbar-inline-action toolbar-inline-action-danger"
                :disabled="saving"
                @click="toggleConfirm('purge')"
              />

              <transition name="toolbar-confirm">
                <div
                  v-if="confirmAction"
                  class="toolbar-confirm-popover"
                  role="dialog"
                  aria-live="polite"
                >
                  <span class="toolbar-confirm-kicker">
                    {{ confirmAction === 'purge' ? t('notes.purgeAction') : t('common.delete') }}
                  </span>
                  <p class="toolbar-confirm-message">
                    {{ confirmAction === 'purge' ? t('notes.purgeConfirm') : t('notes.deleteConfirm') }}
                  </p>
                  <div class="toolbar-confirm-actions">
                    <Button
                      type="button"
                      size="small"
                      severity="secondary"
                      text
                      :label="t('common.cancel')"
                      @click="closeConfirm"
                    />
                    <Button
                      type="button"
                      size="small"
                      severity="danger"
                      :label="confirmAction === 'purge' ? t('notes.purgeAction') : t('common.delete')"
                      @click="confirmCurrentAction"
                    />
                  </div>
                </div>
              </transition>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps({
  note: {
    type: Object,
    default: null,
  },
  isTrashView: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:title',
  'update:language',
  'toggle-star',
  'delete',
  'restore',
  'purge',
  'upload-image',
  'insert-markdown',
  'share-note',
]);

const { locale, t } = useI18n();
const confirmAction = ref('');
const confirmAnchorRef = ref(null);
const savedSignature = ref('');
const markdownActions = computed(() => ([
  {
    key: 'heading',
    icon: 'pi pi-hashtag',
    label: t('notes.insertHeading'),
  },
  {
    key: 'bold',
    icon: 'pi pi-bold',
    label: t('notes.insertBold'),
  },
  {
    key: 'list',
    icon: 'pi pi-list',
    label: t('notes.insertList'),
  },
  {
    key: 'link',
    icon: 'pi pi-link',
    label: t('notes.insertLink'),
  },
  {
    key: 'code',
    icon: 'pi pi-code',
    label: t('notes.insertCodeBlock'),
  },
]));
const formattedUpdatedAt = computed(() => {
  const source = props.note?.updatedAt;

  if (!source) {
    return '';
  }

  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return source;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
});
const currentSignature = computed(() => serializeNoteSyncState(props.note));
const syncStatus = computed(() => {
  if (props.saving) {
    return 'saving';
  }

  if (!props.note) {
    return 'saved';
  }

  return currentSignature.value !== savedSignature.value ? 'pending' : 'saved';
});
const syncStatusLabel = computed(() => {
  if (syncStatus.value === 'saving') {
    return t('notes.syncStatusSaving');
  }

  if (syncStatus.value === 'pending') {
    return t('notes.syncStatusPending');
  }

  return t('notes.syncStatusSaved');
});
const syncStatusIcon = computed(() => {
  if (syncStatus.value === 'saving') {
    return 'pi-spin pi-sync';
  }

  if (syncStatus.value === 'pending') {
    return 'pi-pencil';
  }

  return 'pi-check-circle';
});

function serializeNoteSyncState(note) {
  if (!note) {
    return '';
  }

  return JSON.stringify({
    id: note.id ?? null,
    folderId: note.folderId ?? null,
    title: note.title ?? '',
    content: note.content ?? '',
    primaryLanguage: note.primaryLanguage ?? '',
    isStarred: note.isStarred ?? false,
    tagIds: note.tagIds ?? [],
    version: note.version ?? null,
  });
}

function closeConfirm() {
  confirmAction.value = '';
}

function toggleConfirm(action) {
  confirmAction.value = confirmAction.value === action ? '' : action;
}

function confirmCurrentAction() {
  const action = confirmAction.value;

  if (!action) {
    return;
  }

  closeConfirm();
  emit(action);
}

function handlePointerDown(event) {
  if (!confirmAction.value) {
    return;
  }

  const anchor = confirmAnchorRef.value;

  if (anchor instanceof HTMLElement && anchor.contains(event.target)) {
    return;
  }

  closeConfirm();
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    closeConfirm();
  }
}

watch(() => [props.note?.id, props.isTrashView, props.saving], closeConfirm);
watch(
  () => props.note?.id,
  () => {
    savedSignature.value = serializeNoteSyncState(props.note);
  },
  { immediate: true },
);
watch(
  () => `${props.note?.id ?? ''}:${props.note?.updatedAt ?? ''}:${props.note?.version ?? ''}`,
  () => {
    if (!props.saving && props.note) {
      savedSignature.value = serializeNoteSyncState(props.note);
    }
  },
);

onMounted(() => {
  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.toolbar-card {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--panel-section-border, color-mix(in srgb, var(--surface-border) 85%, var(--primary-color)));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 92%, transparent);
}

.toolbar-header,
.toolbar-inline-strip,
.toolbar-actions,
.toolbar-action-group {
  display: flex;
  align-items: center;
}

.toolbar-header {
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-title-stack {
  flex: 1;
  min-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.toolbar-sync-status {
  width: fit-content;
  min-height: 1.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.24rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 92%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.toolbar-sync-status-saving {
  border-color: color-mix(in srgb, var(--primary-color) 32%, var(--panel-section-border, var(--surface-border)));
  background: color-mix(in srgb, var(--primary-color) 12%, var(--panel-section-surface, var(--surface-ground)));
  color: var(--primary-color);
}

.toolbar-sync-status-pending {
  border-color: color-mix(in srgb, #d97706 28%, var(--panel-section-border, var(--surface-border)));
  background: color-mix(in srgb, #f59e0b 12%, var(--panel-section-surface, var(--surface-ground)));
  color: #b45309;
}

.toolbar-sync-icon {
  font-size: 0.78rem;
}

.toolbar-title-input {
  width: 100%;
  min-width: 0;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.toolbar-title-input::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 82%, transparent);
}

.toolbar-inline-strip {
  gap: 0.85rem;
  flex-wrap: wrap;
}

.toolbar-language-shell {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.8rem;
}

.toolbar-inline-label,
.toolbar-meta-item {
  font-size: 0.76rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.toolbar-inline-label {
  color: var(--text-color-secondary);
}

.toolbar-language-input {
  width: 8rem;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 0.92rem;
  font-weight: 600;
}

.toolbar-meta-item {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  color: var(--text-color-secondary);
  position: relative;
}

.toolbar-meta-item::before {
  content: '';
  width: 1px;
  height: 0.9rem;
  margin-right: 0.85rem;
  background: color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 72%, transparent);
}

.toolbar-actions {
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--panel-section-border, color-mix(in srgb, var(--surface-border) 75%, transparent));
}

.toolbar-actions-main {
  flex: 1 1 38rem;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toolbar-action-group {
  gap: 0.45rem;
  flex-wrap: wrap;
}

.toolbar-action-group-trailing {
  margin-left: auto;
}

.toolbar-action-group :deep(.p-button.p-button-text) {
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 80%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 90%, transparent);
}

.toolbar-markdown-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding-inline: 0.55rem;
  border-inline: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
}

.toolbar-inline-action {
  min-width: auto;
}

.toolbar-editor-hint {
  flex: 1 1 31rem;
  min-width: 16rem;
  max-width: 100%;
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 92%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  font-family: var(--font-mono);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-editor-hint i {
  color: var(--primary-color);
  flex-shrink: 0;
}

.toolbar-editor-hint span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-confirm-anchor {
  position: relative;
  display: inline-flex;
}

.toolbar-confirm-popover {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 24;
  width: min(18.5rem, calc(100vw - 2rem));
  padding: 0.8rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--danger-color, #dc2626) 22%, var(--panel-section-border, var(--surface-border)));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 98%, transparent);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.toolbar-confirm-popover::before {
  content: '';
  position: absolute;
  top: -0.42rem;
  right: 1rem;
  width: 0.75rem;
  height: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--danger-color, #dc2626) 22%, var(--panel-section-border, var(--surface-border)));
  border-left: 1px solid color-mix(in srgb, var(--danger-color, #dc2626) 22%, var(--panel-section-border, var(--surface-border)));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 98%, transparent);
  transform: rotate(45deg);
}

.toolbar-confirm-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 1.3rem;
  color: var(--danger-color, #dc2626);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toolbar-confirm-message {
  margin: 0.35rem 0 0;
  color: var(--text-color);
  font-size: 0.88rem;
  line-height: 1.55;
}

.toolbar-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.8rem;
}

.toolbar-confirm-enter-active,
.toolbar-confirm-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.toolbar-confirm-enter-from,
.toolbar-confirm-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}

@media (max-width: 1180px) {
  .toolbar-title-stack {
    min-width: 100%;
  }

  .toolbar-actions {
    align-items: stretch;
  }

  .toolbar-actions-main {
    width: 100%;
  }

  .toolbar-action-group-trailing {
    margin-left: 0;
  }

  .toolbar-editor-hint {
    width: 100%;
    flex-basis: 100%;
  }
}

@media (max-width: 760px) {
  .toolbar-header,
  .toolbar-actions {
    align-items: stretch;
  }

  .toolbar-inline-strip,
  .toolbar-action-group {
    justify-content: flex-start;
  }

  .toolbar-sync-status {
    width: 100%;
    justify-content: center;
  }

  .toolbar-language-shell {
    width: 100%;
  }

  .toolbar-language-input {
    width: 100%;
  }

  .toolbar-markdown-actions {
    padding-inline: 0;
    border-inline: 0;
  }

  .toolbar-editor-hint {
    padding-inline: 0.65rem;
  }

  .toolbar-confirm-popover {
    right: auto;
    left: 0;
  }

  .toolbar-confirm-popover::before {
    right: auto;
    left: 1rem;
  }
}
</style>
