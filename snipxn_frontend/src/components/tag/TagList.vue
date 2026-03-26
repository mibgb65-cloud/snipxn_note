<template>
  <div class="tag-list">
    <div class="tag-items">
      <div
        class="tag-item"
        :class="{ 'tag-item-active': !activeTag }"
      >
        <button
          type="button"
          class="tag-trigger"
          @click="$emit('select', '')"
        >
          <span class="tag-icon-shell tag-icon-shell-neutral">
            <i class="pi pi-tags" aria-hidden="true" />
          </span>
          <span class="tag-name">{{ t('sidebar.allTags') }}</span>
        </button>
      </div>

      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-item tag-item-with-actions"
        :class="{ 'tag-item-active': String(activeTag) === String(tag.id) }"
        :style="getTagStyle(tag.color)"
      >
        <button
          type="button"
          class="tag-trigger"
          @click="$emit('select', String(tag.id))"
        >
          <span class="tag-icon-shell">
            <span class="tag-dot" aria-hidden="true" />
          </span>
          <span class="tag-name">{{ tag.name }}</span>
        </button>

        <div class="tag-actions">
          <button
            type="button"
            class="tag-action-btn"
            :aria-label="`${t('common.delete')} ${tag.name}`"
            :title="t('common.delete')"
            @click.stop="$emit('delete', tag.id)"
          >
            <i class="pi pi-times" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="!tags.length" class="tag-empty">
      <span class="tag-empty-icon" aria-hidden="true">
        <i class="pi pi-tags" />
      </span>
      <div class="tag-empty-copy">
        <p class="tag-empty-title m-0">{{ t('sidebar.noTags') }}</p>
        <p class="tag-empty-hint m-0">{{ t('sidebar.noTagsHint') }}</p>
      </div>
    </div>

    <button
      type="button"
      class="tag-create-button"
      @click="$emit('create')"
    >
      <i class="pi pi-plus" aria-hidden="true" />
      <span>{{ t('notes.newTag') }}</span>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  activeTag: {
    type: String,
    default: '',
  },
});

defineEmits(['select', 'delete', 'create']);

const { t } = useI18n();

function getTagStyle(color) {
  return {
    '--tag-color': color || 'var(--primary-color)',
  };
}
</script>

<style scoped>
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.tag-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Tag item row ── */
.tag-item {
  --tag-color: var(--primary-color);
  position: relative;
  border-left: 2px solid transparent;
  border-bottom: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 75%, transparent);
  background: transparent;
  transition: background-color 180ms ease, border-color 180ms ease;
}

.tag-item:hover,
.tag-item-active {
  background: color-mix(in srgb, var(--tag-color) 8%, transparent);
  border-left-color: var(--tag-color);
}

/* ── Trigger button (full row) ── */
.tag-trigger {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0.7rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  text-align: left;
}

.tag-item-with-actions .tag-trigger {
  padding-right: 2.8rem;
}

/* ── Icon shell (houses dot or icon) ── */
.tag-icon-shell {
  width: 1.85rem;
  height: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--tag-color) 12%, var(--panel-section-strong, var(--surface-card)));
  color: var(--tag-color);
  transition: background-color 180ms ease;
}

.tag-icon-shell-neutral {
  --tag-color: var(--primary-color);
  font-size: 0.82rem;
}

.tag-item-active .tag-icon-shell {
  background: color-mix(in srgb, var(--tag-color) 18%, var(--panel-section-strong, var(--surface-card)));
}

/* ── Color dot ── */
.tag-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--tag-color);
  box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--tag-color) 18%, transparent);
}

/* ── Tag name ── */
.tag-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 0.86rem;
  font-weight: 600;
}

.tag-item-active .tag-name {
  color: color-mix(in srgb, var(--tag-color) 72%, var(--text-color));
}

/* ── Hover actions ── */
.tag-actions {
  position: absolute;
  top: 50%;
  right: 0.55rem;
  display: flex;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-50%);
  transition: opacity 140ms ease, visibility 140ms ease;
}

.tag-item:hover .tag-actions,
.tag-item:focus-within .tag-actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.tag-action-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 80%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 94%, transparent);
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 0.72rem;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.tag-action-btn:hover {
  border-color: color-mix(in srgb, #dc2626 34%, var(--panel-section-border, var(--surface-border)));
  background: color-mix(in srgb, #dc2626 8%, var(--panel-section-strong, var(--surface-card)));
  color: #dc2626;
}

/* ── Empty state ── */
.tag-empty {
  width: 100%;
  padding: 0.85rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 18%, var(--app-border, var(--surface-border)));
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-ground)) 24%, transparent);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tag-empty-icon {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.375rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 84%, transparent);
  background: color-mix(in srgb, var(--primary-color) 8%, var(--panel-section-strong, var(--surface-card)));
  color: var(--primary-color);
  font-size: 0.88rem;
}

.tag-empty-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.tag-empty-title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-color);
}

.tag-empty-hint {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

/* ── Create button ── */
.tag-create-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 28%, var(--app-border, var(--surface-border)));
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--primary-color) 5%, transparent);
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.tag-create-button:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary-color) 44%, var(--app-border, var(--surface-border)));
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
}
</style>
