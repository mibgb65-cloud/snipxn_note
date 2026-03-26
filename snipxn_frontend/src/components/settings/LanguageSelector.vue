<template>
  <section class="language-selector">
    <div class="language-grid">
      <button
        v-for="lang in languages"
        :key="lang.id"
        type="button"
        class="language-card"
        :class="{ 'language-card-active': locale === lang.id }"
        @click="switchLanguage(lang.id)"
      >
        <span class="language-card-preview">
          {{ t(lang.previewKey) }}
        </span>
        <span class="language-card-label">{{ t(lang.nameKey) }}</span>
      </button>
    </div>

    <div class="language-hint-card">
      <i class="pi pi-info-circle language-hint-icon" aria-hidden="true" />
      <p class="language-hint-text">{{ t('language.hint') }}</p>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { setAppLocale } from '../../i18n';

const { locale, t } = useI18n();
const toast = useToast();

const languages = [
  { id: 'zh', nameKey: 'language.zh', previewKey: 'language.zhPreview' },
  { id: 'en', nameKey: 'language.en', previewKey: 'language.enPreview' },
];

function switchLanguage(nextLocale) {
  setAppLocale(nextLocale);
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('language.changed'),
    life: 2500,
  });
}
</script>

<style scoped>
.language-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.language-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.language-card {
  padding: 0.9rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: inherit;
  font: inherit;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.language-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.language-card-active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
}

.language-card-preview {
  display: block;
  padding: 0.6rem 0.5rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--app-panel-inset) 80%, transparent);
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.language-card-label {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-color);
}

.language-hint-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
}

.language-hint-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.language-hint-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .language-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
