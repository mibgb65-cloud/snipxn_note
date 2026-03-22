<template>
  <div class="tag-list">
    <template v-if="tags.length">
      <button
        type="button"
        class="tag-button"
        :class="{ 'tag-button-active': !activeTag }"
        @click="$emit('select', '')"
      >
        <Tag :value="t('sidebar.allTags')" />
      </button>

      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="tag-button"
        :class="{ 'tag-button-active': activeTag === tag }"
        @click="$emit('select', tag)"
      >
        <Tag :value="tag" />
      </button>
    </template>

    <div v-else class="tag-empty">
      <span class="tag-empty-icon" aria-hidden="true">
        <i class="pi pi-tags" />
      </span>
      <div class="tag-empty-copy">
        <p class="tag-empty-title m-0">{{ t('sidebar.noTags') }}</p>
        <p class="tag-empty-hint m-0">{{ t('sidebar.noTagsHint') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';

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

defineEmits(['select']);

const { t } = useI18n();
</script>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-content: flex-start;
}

.tag-button {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  transition: transform 180ms ease, filter 180ms ease;
}

.tag-button:hover,
.tag-button-active {
  transform: none;
  filter: saturate(1.05);
}

.tag-button :deep(.p-tag) {
  font-family: var(--font-mono);
  font-weight: 600;
  background: color-mix(in srgb, var(--surface-ground) 22%, var(--surface-card));
  border: 1px solid color-mix(in srgb, var(--surface-border) 76%, transparent);
}

.tag-button-active :deep(.p-tag) {
  background: color-mix(in srgb, var(--primary-color) 18%, var(--surface-card));
  color: var(--primary-color);
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--surface-border));
}

.tag-empty {
  width: 100%;
  min-height: 7.5rem;
  padding: 0.9rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 18%, var(--surface-border));
  background: color-mix(in srgb, var(--surface-ground) 24%, transparent);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.tag-empty-icon {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--surface-border) 84%, transparent);
  background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-card));
  color: var(--primary-color);
  flex-shrink: 0;
}

.tag-empty-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.tag-empty-title {
  font-size: 0.9rem;
  color: var(--text-color);
}

.tag-empty-hint {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.55;
}
</style>
