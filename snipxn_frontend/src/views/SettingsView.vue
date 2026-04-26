<template>
  <div class="settings-page-shell animate-fade-in">
    <div class="settings-page-frame">
      <header class="settings-page-topbar animate-fade-in-up delay-100">
        <div class="settings-page-brand">
          <div class="settings-page-brand-icon">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="36" height="36">
          </div>

          <div class="settings-page-brand-copy">
            <div class="settings-page-eyebrow">{{ t('app.name') }}</div>
            <h1 class="settings-page-title">{{ t('settings.title') }}</h1>
          </div>
        </div>

        <section
          ref="settingsSearchRef"
          class="settings-page-command"
          :class="{ 'settings-page-command-open': showSettingsSearchDropdown }"
          @focusin="handleSettingsSearchFocusIn"
          @focusout="handleSettingsSearchFocusOut"
        >
          <div class="settings-page-command-search">
            <i class="pi pi-search settings-page-command-search-icon" aria-hidden="true" />
            <InputText
              id="settings-command-search"
              :model-value="settingsSearchQuery"
              :placeholder="t('settings.searchPlaceholder')"
              class="settings-page-command-input"
              @update:model-value="handleSettingsSearchInput"
              @keydown.down.prevent="handleSettingsSearchStep(1)"
              @keydown.up.prevent="handleSettingsSearchStep(-1)"
              @keydown.enter.prevent="handleSettingsSearchEnter"
              @keydown.esc.prevent="handleSettingsSearchEscape"
            />
          </div>

          <div class="settings-page-command-pills" aria-label="settings status">
            <span class="settings-page-pill">{{ currentLocaleLabel }}</span>
            <span class="settings-page-pill">{{ currentThemeLabel }}</span>
            <span class="settings-page-pill">{{ t('settings.description') }}</span>
          </div>

          <div
            v-if="showSettingsSearchDropdown"
            class="settings-page-command-results"
            role="listbox"
            :aria-label="t('common.search')"
          >
            <button
              v-for="(section, index) in settingsSearchResults"
              :key="section.id"
              type="button"
              class="settings-page-command-result"
              :class="{ 'settings-page-command-result-active': index === settingsSearchActiveIndex }"
              role="option"
              :aria-selected="index === settingsSearchActiveIndex"
              @mousedown.prevent
              @mouseenter="settingsSearchActiveIndex = index"
              @click="handleOpenSettingsSearchResult(section)"
            >
              <span class="settings-page-command-result-badge">
                <i :class="section.icon" aria-hidden="true" />
              </span>
              <span class="settings-page-command-result-main">
                <span class="settings-page-command-result-title">{{ section.label }}</span>
                <span class="settings-page-command-result-summary">{{ section.description }}</span>
              </span>
            </button>

            <div v-if="!settingsSearchResults.length" class="settings-page-command-empty">
              {{ t('settings.searchEmpty') }}
            </div>
          </div>
        </section>

        <div class="settings-page-topbar-side">
          <div class="settings-page-summary">
            <article v-for="item in summaryMetrics" :key="item.id" class="settings-page-summary-card">
              <span class="settings-page-summary-value">{{ item.value }}</span>
              <span class="settings-page-summary-label">{{ item.label }}</span>
            </article>
          </div>

          <div class="settings-page-actions">
            <div class="settings-page-control-group">
              <ThemeToggle />
              <LangToggle />
            </div>

            <Button
              icon="pi pi-list-check"
              :label="t('settings.changelog')"
              severity="secondary"
              text
              class="settings-page-link-button"
              @click="router.push('/changelog')"
            />

            <Button
              icon="pi pi-arrow-left"
              :label="t('settings.backToWorkspace')"
              severity="secondary"
              outlined
              @click="router.push('/workspace')"
            />
          </div>
        </div>
      </header>

      <main class="settings-page-body animate-fade-in-up delay-150">
        <section class="settings-page-overview">
          <article class="settings-page-profile-card">
            <div class="settings-page-kicker">{{ t('settings.profile') }}</div>
            <strong class="settings-page-profile-name">{{ profileHeading }}</strong>
            <p class="settings-page-profile-copy">{{ profileSubcopy }}</p>
          </article>

          <article class="settings-page-meta-card">
            <span class="settings-page-meta-label">{{ t('settings.devices') }}</span>
            <strong class="settings-page-meta-value">{{ userStore.devices.length }}</strong>
            <span class="settings-page-meta-copy">{{ t('settings.devicesDescription') }}</span>
          </article>

          <article class="settings-page-meta-card">
            <span class="settings-page-meta-label">{{ t('settings.theme') }}</span>
            <strong class="settings-page-meta-value">{{ currentThemeLabel }}</strong>
            <span class="settings-page-meta-copy">{{ t('theme.description') }}</span>
          </article>

          <article class="settings-page-meta-card">
            <span class="settings-page-meta-label">{{ t('storage.title') }}</span>
            <strong class="settings-page-meta-value">{{ storageMetricValue }}</strong>
            <span class="settings-page-meta-copy">{{ storageSummary }}</span>
          </article>
        </section>

        <section class="settings-page-panel">
          <SettingsPanel
            :initial-section="settingsActiveSection"
            @section-change="handleSettingsSectionChange"
          />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import SettingsPanel from '../components/settings/SettingsPanel.vue';
import { buildSettingsSections } from '../components/settings/settingsSections';
import { useLogoUrl } from '../composables/useLogoUrl';

const { logoUrl } = useLogoUrl();
import { SUPPORTED_LOCALES } from '../i18n';
import { useTheme } from '../composables/useTheme';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/user';

const router = useRouter();
const { locale, t } = useI18n();
const { themeMode } = useTheme();
const authStore = useAuthStore();
const userStore = useUserStore();
const settingsSearchQuery = ref('');
const settingsActiveSection = ref('profile');
const settingsSearchRef = ref(null);
const settingsSearchFocused = ref(false);
const settingsSearchActiveIndex = ref(-1);

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = numericValue;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

const currentLocaleLabel = computed(() => (
  SUPPORTED_LOCALES.find((item) => item.code === locale.value)?.label || locale.value.toUpperCase()
));
const currentThemeLabel = computed(() => (
  themeMode.value === 'dark' ? t('theme.dark') : t('theme.light')
));
const profileHeading = computed(() => (
  userStore.profile?.nickname
  || userStore.profile?.email
  || authStore.user?.email
  || t('app.name')
));
const profileSubcopy = computed(() => (
  userStore.profile?.bio
  || userStore.profile?.email
  || authStore.user?.email
  || t('settings.quickHint')
));
const storageMetricValue = computed(() => (
  userStore.profile?.storageLimit ? `${userStore.storageUsagePercent}%` : '--'
));
const storageSummary = computed(() => {
  if (!userStore.profile?.storageLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(userStore.profile.storageUsed),
    limit: formatBytes(userStore.profile.storageLimit),
  });
});
const summaryMetrics = computed(() => ([
  {
    id: 'devices',
    value: userStore.devices.length,
    label: t('settings.devices'),
  },
  {
    id: 'locale',
    value: locale.value.toUpperCase(),
    label: t('settings.language'),
  },
  {
    id: 'storage',
    value: storageMetricValue.value,
    label: t('settings.storage'),
  },
]));
const settingsSections = computed(() => buildSettingsSections(t));
const settingsSearchResults = computed(() => {
  const query = String(settingsSearchQuery.value || '').trim().toLowerCase();

  if (!query) {
    return [];
  }

  return settingsSections.value
    .filter((section) => {
      const label = String(section.label || '').toLowerCase();
      const description = String(section.description || '').toLowerCase();
      return [label, description].some((value) => value.includes(query));
    })
    .map((section) => {
      const label = String(section.label || '').toLowerCase();
      const description = String(section.description || '').toLowerCase();
      let rank = 3;

      if (label === query) rank = 0;
      else if (label.startsWith(query)) rank = 1;
      else if (label.includes(query)) rank = 2;
      else if (description.includes(query)) rank = 3;

      return {
        ...section,
        rank,
      };
    })
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, 7);
});
const showSettingsSearchDropdown = computed(() => (
  settingsSearchFocused.value && String(settingsSearchQuery.value || '').trim().length > 0
));

function handleSettingsSearchInput(value) {
  settingsSearchQuery.value = value;
  settingsSearchFocused.value = true;
  settingsSearchActiveIndex.value = String(value || '').trim() ? 0 : -1;
}

function handleSettingsSearchFocusIn() {
  settingsSearchFocused.value = true;
}

function handleSettingsSearchFocusOut(event) {
  const nextFocusedElement = event.relatedTarget;

  if (nextFocusedElement instanceof Node && settingsSearchRef.value?.contains(nextFocusedElement)) {
    return;
  }

  settingsSearchFocused.value = false;
  settingsSearchActiveIndex.value = -1;
}

function handleSettingsSearchStep(direction) {
  if (!showSettingsSearchDropdown.value || !settingsSearchResults.value.length) {
    return;
  }

  const nextIndex = settingsSearchActiveIndex.value + direction;
  const resultsCount = settingsSearchResults.value.length;
  settingsSearchActiveIndex.value = (nextIndex + resultsCount) % resultsCount;
}

function handleSettingsSearchEscape() {
  settingsSearchFocused.value = false;
  settingsSearchActiveIndex.value = -1;
}

function handleOpenSettingsSearchResult(section) {
  settingsActiveSection.value = section.id;
  settingsSearchQuery.value = section.label;
  settingsSearchFocused.value = false;
  settingsSearchActiveIndex.value = -1;
}

function handleSettingsSearchEnter() {
  if (!showSettingsSearchDropdown.value || settingsSearchActiveIndex.value < 0) {
    return;
  }

  const targetSection = settingsSearchResults.value[settingsSearchActiveIndex.value];

  if (targetSection) {
    handleOpenSettingsSearchResult(targetSection);
  }
}

function handleSettingsSectionChange(section) {
  settingsActiveSection.value = section;
}

watch(
  () => settingsSearchResults.value.length,
  (resultCount) => {
    if (!resultCount) {
      settingsSearchActiveIndex.value = -1;
      return;
    }

    if (settingsSearchActiveIndex.value < 0 || settingsSearchActiveIndex.value >= resultCount) {
      settingsSearchActiveIndex.value = 0;
    }
  },
);
</script>

<style scoped>
.settings-page-shell {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-page-shell > * {
  min-width: 0;
  min-height: 0;
}

.settings-page-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.settings-page-topbar {
  position: relative;
  z-index: 18;
  overflow: visible;
  isolation: isolate;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(260px, 1fr) minmax(360px, auto);
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.settings-page-brand,
.settings-page-command-pills,
.settings-page-topbar-side,
.settings-page-summary,
.settings-page-actions,
.settings-page-control-group,
.settings-page-command-search,
.settings-page-command-result,
.settings-page-command-result-main {
  display: flex;
  align-items: center;
}

.settings-page-brand {
  gap: 0.7rem;
  min-width: 0;
}

.settings-page-brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
}

.settings-page-brand-copy {
  min-width: 0;
}

.settings-page-eyebrow,
.settings-page-kicker,
.settings-page-meta-label,
.settings-page-summary-label {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-page-title,
.settings-page-command-title,
.settings-page-profile-name,
.settings-page-meta-value {
  margin: 0;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.settings-page-title {
  font-size: 1.2rem;
  line-height: 1;
}

.settings-page-command {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 2.55rem;
  padding: 0 0.8rem;
  border: 1px solid var(--app-border);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  transition: border-color 180ms ease, background-color 180ms ease;
}

.settings-page-command:focus-within,
.settings-page-command-open {
  z-index: 40;
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.settings-page-command-search {
  min-width: 0;
  gap: 0.6rem;
}

.settings-page-command-search-icon {
  color: var(--primary-color);
  font-size: 0.95rem;
}

.settings-page-command-input {
  flex: 1;
  min-width: 0;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--text-color);
  padding: 0 !important;
}

.settings-page-command-input:enabled:focus {
  box-shadow: none !important;
}

.settings-page-command-body,
.settings-page-profile-copy,
.settings-page-meta-copy {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.settings-page-command-pills {
  gap: 0.35rem;
  flex-wrap: nowrap;
  overflow: hidden;
}

.settings-page-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0 0.45rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  white-space: nowrap;
}

.settings-page-command-results {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 80;
  display: grid;
  gap: 0;
  padding: 0.35rem 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 16%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-strong) 99%, transparent);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
}

.settings-page-command-result {
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease;
}

.settings-page-command-result:hover,
.settings-page-command-result-active {
  background: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.settings-page-command-result-badge {
  width: 2rem;
  height: 2rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 16%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.settings-page-command-result-main {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.settings-page-command-result-title {
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
}

.settings-page-command-result-summary {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
}

.settings-page-command-empty {
  padding: 0.9rem 0.85rem;
  color: var(--text-color-secondary);
  font-size: 0.84rem;
}

.settings-page-topbar-side {
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: 0;
}

.settings-page-summary {
  gap: 0.55rem;
}

.settings-page-summary-card {
  min-width: 4.5rem;
  padding: 0.35rem 0.6rem;
  border-left: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.settings-page-summary-value {
  color: var(--text-color);
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.settings-page-summary-label {
  font-size: 0.68rem;
}

.settings-page-actions {
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.settings-page-control-group {
  gap: 0.3rem;
  padding-right: 0.5rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--app-border);
}

.settings-page-link-button {
  color: var(--primary-color);
}

.settings-page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.settings-page-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 1fr));
  gap: 1rem;
  flex-shrink: 0;
}

.settings-page-profile-card,
.settings-page-meta-card,
.settings-page-panel {
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.settings-page-profile-card,
.settings-page-meta-card {
  min-width: 0;
  padding: 1rem;
}

.settings-page-profile-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.45rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
}

.settings-page-profile-name,
.settings-page-meta-value {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.settings-page-profile-name {
  -webkit-line-clamp: 2;
  font-size: clamp(1.3rem, 2vw, 1.85rem);
  line-height: 1.08;
}

.settings-page-meta-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.settings-page-meta-value {
  -webkit-line-clamp: 3;
  font-size: 1.2rem;
  line-height: 1.2;
}

.settings-page-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1280px) {
  .settings-page-topbar {
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  }

  .settings-page-topbar-side {
    grid-column: 1 / -1;
    justify-content: space-between;
  }

  .settings-page-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .settings-page-shell,
  .settings-page-frame {
    height: auto;
    min-height: 100vh;
    max-height: none;
  }

  .settings-page-topbar,
  .settings-page-topbar-side,
  .settings-page-summary,
  .settings-page-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .settings-page-control-group {
    border-right: 0;
    padding-right: 0;
    margin-right: 0;
  }

  .settings-page-body {
    overflow: visible;
  }

  .settings-page-panel {
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .settings-page-body {
    padding: 0.85rem;
  }

  .settings-page-command-pills {
    display: none;
  }

  .settings-page-command-result {
    align-items: flex-start;
  }

  .settings-page-overview {
    grid-template-columns: 1fr;
  }

  .settings-page-command,
  .settings-page-profile-card,
  .settings-page-meta-card {
    padding: 0.9rem;
  }
}

@media (max-width: 480px) {
  .settings-page-body {
    padding: 0.5rem;
  }

  .settings-page-topbar {
    padding: 0.4rem 0.65rem;
  }

  .settings-page-command,
  .settings-page-profile-card,
  .settings-page-meta-card {
    padding: 0.65rem;
  }

  .settings-page-brand-copy .settings-page-eyebrow {
    display: none;
  }

  .settings-page-title {
    font-size: 1rem;
  }
}
</style>
