<template>
  <button
    type="button"
    class="note-card"
    :class="{ 'note-card-active': selected }"
    @click="$emit('select', note.id)"
  >
    <div class="note-card-top">
      <div class="note-language-shell">
        <span class="note-file-icon">
          <i class="pi pi-file" />
        </span>
        <Tag :value="note.primaryLanguage || 'Markdown'" severity="secondary" />
      </div>
      <div class="note-card-trailing">
        <span v-if="note.isStarred" class="note-star-shell">
          <i class="pi pi-star-fill note-star" />
        </span>
      </div>
    </div>

    <h2 class="note-title">{{ note.title || t('notes.untitled') }}</h2>
    <p class="note-summary">
      {{ note.summary || t('notes.emptySummary') }}
    </p>

    <div class="note-card-bottom">
      <div class="note-meta-row">
        <span class="note-meta-item note-meta-item-count">{{ t('notes.characterCountValue', { count: characterCount }) }}</span>
        <span class="note-time-item note-time-item-created">{{ t('notes.createdAtListValue', { time: formattedCreatedTime }) }}</span>
        <span class="note-meta-item note-meta-item-size">{{ t('notes.documentSizeValue', { size: formattedDocumentSize }) }}</span>
        <span class="note-time-item note-time-item-updated">{{ t('notes.updatedAtListValue', { time: formattedUpdatedTime }) }}</span>
      </div>
      <div v-if="previewTags.length" class="note-tags">
        <span v-for="tag in previewTags" :key="tag" class="note-tag">#{{ tag }}</span>
      </div>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select']);

const { locale, t } = useI18n();

function formatDateTime(value) {
  if (!value) {
    return '';
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

const formattedCreatedTime = computed(() => formatDateTime(props.note?.createdAt || props.note?.updatedAt));
const formattedUpdatedTime = computed(() => formatDateTime(props.note?.updatedAt || props.note?.createdAt));
const characterCount = computed(() => {
  if (typeof props.note?.characterCount === 'number') {
    return props.note.characterCount;
  }

  const fallbackSource = props.note?.content || props.note?.summary || '';

  return String(fallbackSource).replace(/\s+/g, '').length;
});
const documentSizeBytes = computed(() => {
  if (typeof props.note?.documentSizeBytes === 'number') {
    return props.note.documentSizeBytes;
  }

  const fallbackSource = props.note?.content || props.note?.summary || '';

  if (!fallbackSource) {
    return 0;
  }

  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(String(fallbackSource)).length;
  }

  return String(fallbackSource).length;
});
const formattedDocumentSize = computed(() => {
  const size = Number(documentSizeBytes.value) || 0;

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
});

const previewTags = computed(() => (props.note?.tagIds || []).slice(0, 3));
</script>

<style scoped>
.note-card {
  position: relative;
  border: 0;
  border-left: 2px solid transparent;
  border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 72%, transparent);
  border-radius: 0;
  background: transparent;
  color: inherit;
  width: 100%;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
  overflow: hidden;
}

.note-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0.35rem;
  height: 100%;
  background: color-mix(in srgb, var(--primary-color) 40%, transparent);
  opacity: 0;
  transition: opacity 180ms ease;
}

.note-card:hover,
.note-card-active {
  border-left-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 6%, transparent);
}

.note-card:hover::before,
.note-card-active::before {
  opacity: 1;
}

.note-card-top,
.note-card-bottom,
.note-card-trailing {
  display: flex;
  align-items: center;
}

.note-card-top {
  justify-content: space-between;
  gap: 0.75rem;
}

.note-language-shell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.note-file-icon {
  width: 1.9rem;
  height: 1.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-card));
  color: var(--primary-color);
  flex-shrink: 0;
}

.note-card-trailing {
  gap: 0.55rem;
}

.note-star-shell {
  width: 1.85rem;
  height: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-card));
}

.note-title {
  margin: 0.9rem 0 0;
  font-size: 1.04rem;
  line-height: 1.4;
  letter-spacing: -0.03em;
  font-weight: 800;
}

.note-summary {
  margin: 0.6rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
  min-height: 3.2em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-card-bottom {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  margin-top: 0.95rem;
  width: 100%;
}

.note-meta-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  row-gap: 0.16rem;
}

.note-meta-item {
  display: inline-flex;
  align-items: center;
  min-height: 1.62rem;
  padding: 0.12rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 72%, transparent);
  background: color-mix(in srgb, var(--surface-ground) 55%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.note-meta-item-count {
  flex-shrink: 0;
  color: var(--text-color);
}

.note-meta-item-size {
  color: var(--text-color-secondary);
}

.note-time-item {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-family: var(--font-mono);
  line-height: 1.25;
  letter-spacing: 0.03em;
  text-align: right;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.note-tag {
  padding: 0.3rem 0.6rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--surface-ground) 40%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.note-star {
  color: var(--primary-color);
}

.note-card :deep(.p-tag) {
  font-family: var(--font-mono);
  border: 1px solid color-mix(in srgb, var(--surface-border) 75%, transparent);
  background: color-mix(in srgb, var(--surface-ground) 24%, var(--surface-card));
}

@media (max-width: 860px) {
  .note-meta-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.55rem;
  }

  .note-time-item {
    justify-self: start;
    text-align: left;
  }
}
</style>
