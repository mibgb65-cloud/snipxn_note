<template>
  <button
    type="button"
    class="icon-control-btn"
    :aria-label="t('theme.title')"
    @click="toggleTheme"
    :title="themeMode === 'light' ? t('theme.dark') : t('theme.light')"
  >
    <i class="pi" :class="themeMode === 'light' ? 'pi-moon' : 'pi-sun'" />
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useTheme } from '../../composables/useTheme';

const { t } = useI18n();
const { themeMode, setTheme } = useTheme();

const toggleTheme = () => {
  setTheme(themeMode.value === 'light' ? 'dark' : 'light');
};
</script>

<style scoped>
.icon-control-btn {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 86%, transparent);
  backdrop-filter: blur(16px);
  color: var(--text-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  font-size: 1rem;
}

.icon-control-btn:hover {
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border-strong));
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 14px 26px -22px color-mix(in srgb, var(--primary-color) 45%, transparent);
}

.icon-control-btn:active {
  transform: translateY(0);
}
</style>
