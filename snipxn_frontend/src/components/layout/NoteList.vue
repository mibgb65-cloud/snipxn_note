<template>
  <section class="panel note-list-panel" :aria-busy="loading">
    <header class="note-list-header">
      <div class="note-list-copy">
        <span class="note-list-kicker">{{ t('notes.title') }}</span>
        <h1 class="note-list-title">{{ title }}</h1>
      </div>

      <div class="note-list-header-actions">
        <div class="note-list-count-shell">
          <span class="note-list-count-label">{{ t('notes.title') }}</span>
          <span class="note-list-count">{{ total }}</span>
        </div>
        <Button v-if="canCreate" icon="pi pi-upload" :label="t('notes.importNotes')" severity="secondary" outlined @click="triggerImport" />
        <Button v-if="canCreate" icon="pi pi-plus" :label="t('notes.newNote')" @click="$emit('create')" />
      </div>
      <input ref="importInputRef" type="file" accept=".md" multiple hidden @change="handleImportFiles" />
    </header>

    <div v-if="loading && !notes.length" class="note-list-loading">
      <Skeleton v-for="index in 4" :key="index" height="7rem" border-radius="1.1rem" />
    </div>

    <div v-else-if="notes.length" class="note-list-content">
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-list-row"
        :class="{ 'note-list-row-active': note.id === selectedNoteId }"
      >
        <NoteListItem
          v-memo="[note.id, selectedNoteId, note.updatedAt, note.createdAt, note.characterCount, note.isStarred, note.title, note.summary, note.tagIds]"
          :note="note"
          :selected="note.id === selectedNoteId"
          @select="$emit('select', $event)"
        />
      </div>
    </div>

    <div v-else class="note-list-empty">
      <i class="pi pi-book note-list-empty-icon" />
      <h3 class="mb-2">{{ t('notes.noNotes') }}</h3>
      <p class="m-0">{{ canCreate ? t('notes.noNotesDescription') : t('notes.noNotesReadonlyDescription') }}</p>
      <Button v-if="canCreate" class="mt-4" icon="pi pi-plus" :label="t('notes.newNote')" @click="$emit('create')" />
    </div>

    <div v-if="loading && notes.length" class="note-list-overlay" aria-hidden="true">
      <span class="note-list-overlay-spinner" />
    </div>

    <Paginator
      v-if="total > size"
      :first="(page - 1) * size"
      :rows="size"
      :total-records="total"
      class="mt-auto"
      @page="$emit('change-page', $event.page + 1)"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import Skeleton from 'primevue/skeleton';
import NoteListItem from '../note/NoteListItem.vue';

const importInputRef = ref(null);

defineProps({
  title: {
    type: String,
    default: '',
  },
  notes: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  selectedNoteId: {
    type: [String, Number, null],
    default: null,
  },
  total: {
    type: Number,
    default: 0,
  },
  page: {
    type: Number,
    default: 1,
  },
  size: {
    type: Number,
    default: 20,
  },
  canCreate: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['select', 'create', 'change-page', 'import']);

const { t } = useI18n();

function triggerImport() {
  importInputRef.value?.click();
}

function handleImportFiles(event) {
  const files = Array.from(event.target.files || []);
  if (files.length) {
    emit('import', files);
  }
  event.target.value = '';
}
</script>

<style scoped>
.panel {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.note-list-panel {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

.note-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--panel-section-border, rgba(255, 255, 255, 0.1));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 92%, transparent);
}

.note-list-copy {
  min-width: 0;
}

.note-list-kicker,
.note-list-count-label {
  font-family: var(--font-mono);
}

.note-list-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.note-list-count-shell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.note-list-count-label {
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.note-list-count {
  min-width: 2.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--panel-section-border, var(--surface-border));
  background: var(--panel-section-surface, var(--surface-hover));
  text-align: center;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--primary-color);
}

.note-list-kicker {
  display: inline-block;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.note-list-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.note-list-content,
.note-list-loading {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.note-list-row {
  position: relative;
  padding: 0;
}

.note-list-empty {
  min-height: 18rem;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  padding: 2rem 1.5rem;
  border: 2px dashed var(--panel-section-border, var(--surface-border));
  border-radius: 0.375rem;
  color: var(--text-color-secondary);
  background: var(--panel-empty-surface, var(--surface-ground));
}

.note-list-overlay {
  position: absolute;
  top: 4.75rem;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--app-panel-strong) 22%, transparent), transparent 22%);
  pointer-events: none;
}

.note-list-overlay-spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid color-mix(in srgb, var(--primary-color) 18%, transparent);
  border-top-color: var(--primary-color);
  border-radius: 999px;
  animation: note-list-spin 0.7s linear infinite;
}

@keyframes note-list-spin {
  to {
    transform: rotate(360deg);
  }
}

.note-list-empty-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

@media (max-width: 720px) {
  .note-list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .note-list-header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
