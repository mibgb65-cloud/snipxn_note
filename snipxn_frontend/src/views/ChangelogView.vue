<template>
  <div class="changelog-page">
    <header class="changelog-topbar">
      <button type="button" class="changelog-brand" @click="router.push('/')">
        <span class="changelog-brand-icon">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="28" height="28">
        </span>
        <span class="changelog-brand-copy">
          <span class="changelog-brand-name">{{ t('app.name') }}</span>
          <span class="changelog-brand-subtitle">{{ t('changelog.navSubtitle') }}</span>
        </span>
      </button>

      <div class="changelog-topbar-actions">
        <ThemeToggle />
        <LangToggle />
        <Button
          icon="pi pi-arrow-left"
          :label="t('landing.backHome')"
          severity="secondary"
          outlined
          class="changelog-topbar-button"
          @click="router.push('/')"
        />
        <Button
          icon="pi pi-arrow-right"
          icon-pos="right"
          :label="workspaceLabel"
          class="accent-cta changelog-topbar-button"
          @click="handleWorkspaceClick"
        />
      </div>
    </header>

    <main class="changelog-main">
      <section class="changelog-hero">
        <div class="changelog-hero-copy">
          <span class="changelog-kicker">{{ t('changelog.kicker') }}</span>
          <h1 class="changelog-title">{{ t('changelog.title') }}</h1>
          <p class="changelog-subtitle">{{ t('changelog.subtitle') }}</p>
        </div>

        <div class="changelog-summary" aria-label="release summary">
          <article class="changelog-summary-item">
            <span class="changelog-summary-label">{{ t('changelog.latestVersion') }}</span>
            <strong>{{ latestEntry.version }}</strong>
          </article>
          <article class="changelog-summary-item">
            <span class="changelog-summary-label">{{ t('changelog.platformCount') }}</span>
            <strong>{{ totalPlatformCount }}</strong>
          </article>
          <article class="changelog-summary-item">
            <span class="changelog-summary-label">{{ t('changelog.releaseCadence') }}</span>
            <strong>{{ t('changelog.releaseCadenceValue') }}</strong>
          </article>
        </div>
      </section>

      <section class="changelog-layout">
        <aside class="changelog-index" aria-label="release index">
          <span class="changelog-index-title">{{ t('changelog.indexTitle') }}</span>
          <a
            v-for="entry in releaseEntries"
            :key="entry.version"
            class="changelog-index-link"
            :href="`#release-${entry.version.replace(/\./g, '-')}`"
          >
            <span>{{ entry.version }}</span>
            <small>{{ entry.date }}</small>
          </a>
        </aside>

        <div class="changelog-feed">
          <article
            v-for="entry in releaseEntries"
            :id="`release-${entry.version.replace(/\./g, '-')}`"
            :key="entry.version"
            class="release-card"
          >
            <div class="release-card-header">
              <div class="release-card-title-block">
                <span class="release-date">{{ entry.date }}</span>
                <h2 class="release-title">{{ entry.version }} · {{ entry.title }}</h2>
                <p class="release-summary">{{ entry.summary }}</p>
              </div>

              <div class="release-platforms" aria-label="included platforms">
                <span
                  v-for="platform in entry.platforms"
                  :key="platform"
                  class="release-platform-pill"
                  :class="platformStyles[platform].class"
                >
                  <i :class="platformStyles[platform].icon" aria-hidden="true" />
                  {{ platformStyles[platform].label }}
                </span>
              </div>
            </div>

            <div class="release-section-grid">
              <section
                v-for="section in entry.sections"
                :key="section.id"
                class="release-section"
              >
                <div class="release-section-heading">
                  <span class="release-section-icon" :class="platformStyles[section.platform].class">
                    <i :class="platformStyles[section.platform].icon" aria-hidden="true" />
                  </span>
                  <h3>{{ section.title }}</h3>
                </div>

                <ul class="release-list">
                  <li v-for="item in section.items" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import { useLogoUrl } from '../composables/useLogoUrl';

const router = useRouter();
const { t } = useI18n();
const { logoUrl } = useLogoUrl();

const hasToken = computed(() => Boolean(localStorage.getItem('accessToken')));
const workspaceLabel = computed(() => (
  hasToken.value ? t('landing.enterWorkspaceCompact') : t('landing.enterAppCompact')
));

const platformStyles = computed(() => ({
  web: {
    label: t('changelog.platformWeb'),
    icon: 'pi pi-desktop',
    class: 'release-platform-web',
  },
  android: {
    label: t('changelog.platformAndroid'),
    icon: 'pi pi-android',
    class: 'release-platform-android',
  },
  backend: {
    label: t('changelog.platformBackend'),
    icon: 'pi pi-database',
    class: 'release-platform-backend',
  },
}));

const releaseEntries = computed(() => [
  {
    version: 'v1.3.2',
    date: '2026-04-26',
    title: t('changelog.v132Title'),
    summary: t('changelog.v132Summary'),
    platforms: ['web', 'android', 'backend'],
    sections: [
      {
        id: 'v132-web',
        platform: 'web',
        title: t('changelog.webUpdates'),
        items: [
          t('changelog.v132Web1'),
          t('changelog.v132Web2'),
        ],
      },
      {
        id: 'v132-android',
        platform: 'android',
        title: t('changelog.androidUpdates'),
        items: [
          t('changelog.v132Android1'),
          t('changelog.v132Android2'),
          t('changelog.v132Android3'),
          t('changelog.v132Android4'),
        ],
      },
      {
        id: 'v132-backend',
        platform: 'backend',
        title: t('changelog.backendUpdates'),
        items: [
          t('changelog.v132Backend1'),
          t('changelog.v132Backend2'),
        ],
      },
    ],
  },
  {
    version: 'v1.3.1',
    date: '2026-04-26',
    title: t('changelog.v131Title'),
    summary: t('changelog.v131Summary'),
    platforms: ['web', 'android', 'backend'],
    sections: [
      {
        id: 'v131-web',
        platform: 'web',
        title: t('changelog.webUpdates'),
        items: [
          t('changelog.v131Web1'),
          t('changelog.v131Web2'),
          t('changelog.v131Web3'),
        ],
      },
      {
        id: 'v131-android',
        platform: 'android',
        title: t('changelog.androidUpdates'),
        items: [
          t('changelog.v131Android1'),
          t('changelog.v131Android2'),
          t('changelog.v131Android3'),
          t('changelog.v131Android4'),
        ],
      },
      {
        id: 'v131-backend',
        platform: 'backend',
        title: t('changelog.backendUpdates'),
        items: [
          t('changelog.v131Backend1'),
          t('changelog.v131Backend2'),
        ],
      },
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-04-26',
    title: t('changelog.v130Title'),
    summary: t('changelog.v130Summary'),
    platforms: ['web', 'android'],
    sections: [
      {
        id: 'v130-web',
        platform: 'web',
        title: t('changelog.webUpdates'),
        items: [
          t('changelog.v130Web1'),
          t('changelog.v130Web2'),
        ],
      },
      {
        id: 'v130-android',
        platform: 'android',
        title: t('changelog.androidUpdates'),
        items: [
          t('changelog.v130Android1'),
          t('changelog.v130Android2'),
        ],
      },
    ],
  },
]);

const latestEntry = computed(() => releaseEntries.value[0]);
const totalPlatformCount = computed(() => (
  new Set(releaseEntries.value.flatMap((entry) => entry.platforms)).size
));

function handleWorkspaceClick() {
  router.push(hasToken.value ? '/workspace' : '/?auth=true');
}
</script>

<style scoped>
.changelog-page {
  min-height: 100dvh;
  color: var(--text-color);
  background: var(--surface-ground);
}

.changelog-topbar {
  position: sticky;
  top: 1rem;
  z-index: 40;
  width: min(1240px, calc(100% - 2rem));
  margin: 1rem auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 92%, transparent);
  box-shadow: var(--app-shadow-soft);
}

.changelog-brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.changelog-brand-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 94%, transparent);
  overflow: hidden;
  flex-shrink: 0;
}

.changelog-brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.changelog-brand-name {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.1;
}

.changelog-brand-subtitle,
.changelog-summary-label,
.release-date,
.changelog-index-title {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.changelog-topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.changelog-main {
  width: min(1240px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 4rem 0 5rem;
}

.changelog-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 1.25rem;
  align-items: end;
  margin-bottom: 1.25rem;
}

.changelog-hero-copy {
  min-width: 0;
}

.changelog-kicker {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
  border-radius: 999px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.changelog-title {
  margin: 1rem 0 0;
  max-width: 48rem;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(2rem, 6vw, 4.75rem);
  font-weight: 800;
  line-height: 1.03;
}

.changelog-subtitle {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
  line-height: 1.75;
}

.changelog-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.changelog-summary-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 96%, transparent);
}

.changelog-summary-item strong {
  font-size: 1.35rem;
  line-height: 1;
}

.changelog-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.changelog-index {
  position: sticky;
  top: 6.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-card)) 94%, transparent);
}

.changelog-index-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: color 180ms, background 180ms;
}

.changelog-index-link:hover {
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.changelog-index-link small {
  color: var(--text-color-secondary);
  font-size: 0.72rem;
}

.changelog-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.release-card {
  scroll-margin-top: 7rem;
  border: 1px solid var(--app-border);
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 97%, transparent);
  overflow: hidden;
}

.release-card-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  padding: 1.25rem;
  border-bottom: 1px solid var(--app-border);
}

.release-card-title-block {
  min-width: 0;
}

.release-title {
  margin: 0.45rem 0 0;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1.18;
}

.release-summary {
  max-width: 48rem;
  margin: 0.75rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.release-platforms {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.release-platform-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.65rem;
  border: 1px solid var(--platform-border);
  border-radius: 999px;
  color: var(--platform-color);
  background: var(--platform-bg);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.release-section-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.release-section {
  min-width: 0;
  padding: 1.25rem;
  border-right: 1px solid var(--app-border);
}

.release-section:last-child {
  border-right: 0;
}

.release-section-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.release-section-heading h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
}

.release-section-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--platform-border);
  border-radius: 0.5rem;
  color: var(--platform-color);
  background: var(--platform-bg);
  flex-shrink: 0;
}

.release-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.release-list li {
  position: relative;
  padding-left: 1rem;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  line-height: 1.65;
}

.release-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 999px;
  background: var(--primary-color);
}

.release-platform-web {
  --platform-color: var(--primary-color);
  --platform-border: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
  --platform-bg: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.release-platform-android {
  --platform-color: var(--app-cta-strong, #059669);
  --platform-border: color-mix(in srgb, var(--app-cta-strong, #059669) 26%, var(--app-border));
  --platform-bg: color-mix(in srgb, var(--app-cta-strong, #059669) 10%, transparent);
}

.release-platform-backend {
  --platform-color: var(--app-support, #0f766e);
  --platform-border: color-mix(in srgb, var(--app-support, #0f766e) 24%, var(--app-border));
  --platform-bg: color-mix(in srgb, var(--app-support, #0f766e) 10%, transparent);
}

@media (max-width: 1080px) {
  .changelog-hero,
  .changelog-layout {
    grid-template-columns: 1fr;
  }

  .changelog-index {
    position: static;
    flex-direction: row;
    overflow-x: auto;
  }

  .changelog-index-title {
    display: none;
  }
}

@media (max-width: 820px) {
  .changelog-topbar {
    position: static;
    width: calc(100% - 1.5rem);
    margin-top: 0.75rem;
    align-items: stretch;
    flex-direction: column;
  }

  .changelog-topbar-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .changelog-hero {
    margin-top: 0;
  }

  .changelog-summary,
  .release-card-header,
  .release-section-grid {
    grid-template-columns: 1fr;
  }

  .release-platforms {
    justify-content: flex-start;
  }

  .release-section {
    border-right: 0;
    border-top: 1px solid var(--app-border);
  }
}

@media (max-width: 560px) {
  .changelog-main {
    width: calc(100% - 1.5rem);
    padding-top: 2rem;
  }

  .changelog-topbar-button {
    width: 100%;
  }

  .changelog-topbar-button :deep(.p-button-label) {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .changelog-index-link,
  .release-platform-pill {
    transition: none;
  }
}
</style>
