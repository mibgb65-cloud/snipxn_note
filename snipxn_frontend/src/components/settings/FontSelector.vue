<template>
  <section class="font-selector">
    <div class="font-section">
      <div class="font-section-header">
        <h4 class="font-section-title">{{ t('font.uiTitle') }}</h4>
        <p class="font-section-description">{{ t('font.uiDescription') }}</p>
      </div>

      <div class="font-grid">
        <button
          v-for="font in UI_FONTS"
          :key="font.id"
          type="button"
          class="font-card"
          :class="{ 'font-card-active': uiFontId === font.id }"
          @click="setUiFont(font.id)"
        >
          <span class="font-card-preview" :style="{ fontFamily: font.fontFamily || undefined }">
            {{ font.preview }}
          </span>
          <span class="font-card-label">{{ t(font.nameKey) }}</span>
        </button>
      </div>
    </div>

    <div class="font-section">
      <div class="font-section-header">
        <h4 class="font-section-title">{{ t('font.codeTitle') }}</h4>
        <p class="font-section-description">{{ t('font.codeDescription') }}</p>
      </div>

      <div class="font-grid">
        <button
          v-for="font in CODE_FONTS"
          :key="font.id"
          type="button"
          class="font-card font-card-code"
          :class="{ 'font-card-active': codeFontId === font.id }"
          @click="setCodeFont(font.id)"
        >
          <span
            class="font-card-preview font-card-preview-code"
            :style="{ fontFamily: font.fontFamily || undefined }"
          >
            {{ font.preview }}
          </span>
          <span class="font-card-label">{{ t(font.nameKey) }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { UI_FONTS, CODE_FONTS } from '../../theme/fonts';
import { useFont } from '../../composables/useFont';

const { t } = useI18n();
const { uiFontId, codeFontId, setUiFont, setCodeFont } = useFont();
</script>

<style scoped>
.font-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.font-section-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.font-section-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.font-section-description {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-color-secondary);
  line-height: 1.55;
}

.font-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.font-card {
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

.font-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.font-card-active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
}

.font-card-preview {
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

.font-card-preview-code {
  background: var(--app-code-bg);
  color: var(--app-code-text);
  border: 1px solid var(--app-code-border);
  font-size: 0.88rem;
  letter-spacing: 0.02em;
}

.font-card-label {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-color);
}

@media (max-width: 720px) {
  .font-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
