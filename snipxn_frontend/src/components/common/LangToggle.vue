<template>
  <div class="lang-switcher-wrapper">
    <button
      type="button"
      class="icon-control-btn"
      :aria-label="t('language.title')"
      @click="toggleMenu"
      aria-haspopup="true"
      aria-controls="lang_menu"
      :title="currentLangTooltip"
    >
      <i class="pi pi-language" />
      <span class="btn-text">{{ currentLangLabelShort }}</span>
    </button>
    <Menu ref="menu" id="lang_menu" :model="langOptions" :popup="true" class="lang-menu" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { setAppLocale, SUPPORTED_LOCALES } from '../../i18n';
import Menu from 'primevue/menu';

const { locale, t } = useI18n();
const menu = ref();

const langOptions = computed(() => {
  return SUPPORTED_LOCALES.map(lang => ({
    label: lang.label,
    icon: locale.value === lang.code ? 'pi pi-check text-primary' : 'pi pi-circle-fill invisible',
    command: () => {
      setAppLocale(lang.code);
    }
  }));
});

const currentLangLabelShort = computed(() => {
  const current = SUPPORTED_LOCALES.find(l => l.code === locale.value);
  return current ? current.short : 'EN';
});

const currentLangTooltip = computed(() => {
  return t('language.title') || 'Switch Language';
});

const toggleMenu = (event) => {
  menu.value.toggle(event);
};
</script>

<style scoped>
.lang-switcher-wrapper {
  position: relative;
  display: inline-block;
}

.icon-control-btn {
  width: auto;
  min-width: 2.75rem;
  height: 2.75rem;
  padding: 0 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 88%, transparent);
  backdrop-filter: blur(16px);
  color: var(--text-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
  box-shadow: inset 0 1px 0 var(--app-control-highlight), var(--app-control-shadow);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.85rem;
}

.icon-control-btn:hover {
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-raised));
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border-strong));
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 14px 26px -22px color-mix(in srgb, var(--primary-color) 45%, transparent);
}

.icon-control-btn:active {
  transform: translateY(0);
  box-shadow: inset 0 1px 0 var(--app-control-highlight), var(--app-control-shadow);
}

.btn-text {
  line-height: 1;
  margin-top: 1px;
}

:deep(.lang-menu) {
  border-radius: 1rem;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
  backdrop-filter: blur(18px);
  overflow: hidden;
  min-width: 140px;
}

html.app-dark :deep(.lang-menu) {
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
}

:deep(.lang-menu .p-menuitem-link) {
  padding: 0.75rem 1rem;
  transition: all 0.2s;
  border-radius: 6px;
  margin: 0.25rem;
}

:deep(.lang-menu .p-menuitem-link:hover) {
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-raised));
  color: var(--primary-color);
}

:deep(.lang-menu .p-menuitem-icon) {
  margin-right: 0.5rem;
  font-size: 0.85rem;
}

:deep(.invisible) {
  visibility: hidden;
}

:deep(.text-primary) {
  color: var(--primary-color);
}
</style>
