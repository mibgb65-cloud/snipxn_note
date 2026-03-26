<template>
  <section class="theme-selector">
    <button
      type="button"
      class="theme-card theme-card-auto"
      :class="{ 'theme-card-active': schemeId === 'auto' }"
      @click="setScheme('auto')"
    >
      <span class="theme-card-icon">
        <i class="pi pi-desktop" />
      </span>
      <span class="theme-card-label">{{ t('theme.schemes.auto') }}</span>
      <span class="theme-card-description">{{ t('theme.autoDescription') }}</span>
    </button>

    <div class="theme-grid">
      <button
        v-for="scheme in SCHEMES"
        :key="scheme.id"
        type="button"
        class="theme-card"
        :class="{ 'theme-card-active': schemeId === scheme.id }"
        @click="setScheme(scheme.id)"
      >
        <span class="theme-card-preview">
          <span class="preview-dot" :style="{ background: scheme.preview.bg }" />
          <span class="preview-dot" :style="{ background: scheme.preview.surface }" />
          <span class="preview-dot preview-dot-primary" :style="{ background: scheme.preview.primary }" />
          <span class="preview-dot" :style="{ background: scheme.preview.text }" />
        </span>

        <span class="theme-card-label">{{ t(scheme.nameKey) }}</span>
        <span v-if="scheme.baseMode === 'light'" class="theme-card-badge">
          <i class="pi pi-sun" /> {{ t('theme.light') }}
        </span>
        <span v-else class="theme-card-badge">
          <i class="pi pi-moon" /> {{ t('theme.dark') }}
        </span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { SCHEMES } from '../../theme/schemes';
import { useTheme } from '../../composables/useTheme';

const { t } = useI18n();
const { schemeId, setScheme } = useTheme();
</script>

<style scoped>
.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.theme-card {
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

.theme-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.theme-card-active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
}

.theme-card-auto {
  width: 100%;
  padding: 1rem;
  flex-direction: row;
  align-items: center;
  gap: 0.85rem;
}

.theme-card-icon {
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: var(--primary-color);
}

.theme-card-label {
  font-weight: 700;
  font-size: 0.96rem;
  color: var(--text-color);
}

.theme-card-description {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  margin-left: auto;
}

.theme-card-preview {
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--app-panel-inset) 80%, transparent);
}

.preview-dot {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.preview-dot-primary {
  width: 1.6rem;
  height: 1.6rem;
}

.theme-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-color-secondary);
}

.theme-card-badge i {
  font-size: 0.7rem;
}

@media (max-width: 720px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
