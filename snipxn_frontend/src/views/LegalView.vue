<template>
  <div class="legal-page">
    <header class="legal-topbar">
      <router-link to="/" class="legal-brand">
        <span class="legal-brand-icon">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="28" height="28">
        </span>
        <span class="legal-brand-copy">
          <span class="legal-brand-name">{{ t('app.name') }}</span>
          <span class="legal-brand-subtitle">{{ t('legal.navSubtitle') }}</span>
        </span>
      </router-link>

      <div class="legal-topbar-actions">
        <ThemeToggle />
        <LangToggle />
        <Button
          icon="pi pi-arrow-left"
          :label="t('legal.backHome')"
          severity="secondary"
          outlined
          class="legal-topbar-button"
          @click="router.push('/')"
        />
      </div>
    </header>

    <main class="legal-main">
      <section class="legal-hero">
        <div class="legal-hero-copy">
          <span class="legal-kicker">{{ t(`legal.${pageType}.kicker`) }}</span>
          <h1 class="legal-title">{{ t(`legal.${pageType}.title`) }}</h1>
          <p class="legal-subtitle">{{ t(`legal.${pageType}.summary`) }}</p>
        </div>

        <div class="legal-meta" aria-label="document metadata">
          <span>{{ t('legal.lastUpdated') }}</span>
          <strong>{{ t(`legal.${pageType}.lastUpdatedValue`) }}</strong>
        </div>
      </section>

      <nav class="legal-tabs" :aria-label="t('legal.documentSwitch')">
        <router-link to="/terms" class="legal-tab" :class="{ 'is-active': pageType === 'terms' }">
          {{ t('auth.termsOfService') }}
        </router-link>
        <router-link to="/privacy" class="legal-tab" :class="{ 'is-active': pageType === 'privacy' }">
          {{ t('auth.privacyPolicy') }}
        </router-link>
      </nav>

      <section class="legal-layout">
        <aside class="legal-index" :aria-label="t('legal.indexTitle')">
          <span class="legal-index-title">{{ t('legal.indexTitle') }}</span>
          <a
            v-for="section in sections"
            :key="section.id"
            class="legal-index-link"
            :href="`#${pageType}-${section.id}`"
          >
            {{ rt(section.title) }}
          </a>
        </aside>

        <article class="legal-document">
          <section
            v-for="section in sections"
            :id="`${pageType}-${section.id}`"
            :key="section.id"
            class="legal-section"
          >
            <h2>{{ rt(section.title) }}</h2>
            <p v-for="paragraph in section.body" :key="paragraph">
              {{ rt(paragraph) }}
            </p>
            <ul v-if="section.items?.length" class="legal-list">
              <li v-for="item in section.items" :key="item">{{ rt(item) }}</li>
            </ul>
          </section>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import { useLogoUrl } from '../composables/useLogoUrl';

const route = useRoute();
const router = useRouter();
const { t, tm, rt } = useI18n();
const { logoUrl } = useLogoUrl();

const pageType = computed(() => route.meta.legalType === 'privacy' ? 'privacy' : 'terms');
const sections = computed(() => tm(`legal.${pageType.value}.sections`) || []);
</script>

<style scoped>
.legal-page {
  min-height: 100dvh;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-bg-alt) 54%, transparent), transparent 22rem),
    var(--app-bg);
  color: var(--text-color);
}

.legal-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.82rem max(1rem, calc((100vw - 1120px) / 2));
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg) 88%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.legal-brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  color: var(--text-color);
  text-decoration: none;
}

.legal-brand-icon {
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: var(--app-panel-strong);
}

.legal-brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.legal-brand-name {
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.1;
}

.legal-brand-subtitle {
  color: var(--text-color-secondary);
  font-size: 0.76rem;
  line-height: 1.2;
}

.legal-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legal-topbar-button {
  min-height: 2.35rem;
  border-radius: 0.42rem;
  white-space: nowrap;
}

.legal-main {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: clamp(2.5rem, 7vw, 5.5rem) 0 4.5rem;
}

.legal-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 2rem;
  padding-bottom: 1.6rem;
  border-bottom: 1px solid var(--app-border);
}

.legal-hero-copy {
  max-width: 46rem;
}

.legal-kicker {
  display: inline-flex;
  margin-bottom: 0.72rem;
  color: var(--primary-color);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legal-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.65rem);
  font-weight: 850;
  letter-spacing: -0.04em;
  line-height: 0.98;
}

.legal-subtitle {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
  line-height: 1.75;
}

.legal-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0 0.1rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  text-align: right;
  white-space: nowrap;
}

.legal-meta strong {
  color: var(--text-color);
  font-size: 0.95rem;
}

.legal-tabs {
  display: inline-flex;
  gap: 0.25rem;
  margin-top: 1.15rem;
  padding: 0.24rem;
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  background: var(--app-panel-inset);
}

.legal-tab {
  min-height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.95rem;
  border-radius: 0.36rem;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 180ms, color 180ms;
}

.legal-tab:hover,
.legal-tab.is-active {
  background: var(--app-panel-strong);
  color: var(--text-color);
}

.legal-layout {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4.5rem);
  margin-top: 2.25rem;
}

.legal-index {
  position: sticky;
  top: 5rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.25rem;
}

.legal-index-title {
  margin-bottom: 0.45rem;
  color: var(--text-color);
  font-size: 0.82rem;
  font-weight: 800;
}

.legal-index-link {
  padding: 0.48rem 0;
  border-bottom: 1px solid var(--app-border);
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  line-height: 1.35;
  text-decoration: none;
  transition: color 180ms;
}

.legal-index-link:hover {
  color: var(--primary-color);
}

.legal-document {
  min-width: 0;
}

.legal-section {
  scroll-margin-top: 6rem;
  padding: 0 0 1.75rem;
  border-bottom: 1px solid var(--app-border);
}

.legal-section + .legal-section {
  padding-top: 1.75rem;
}

.legal-section h2 {
  margin: 0 0 0.82rem;
  color: var(--text-color);
  font-size: 1.18rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.legal-section p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.96rem;
  line-height: 1.85;
}

.legal-section p + p,
.legal-list {
  margin-top: 0.72rem;
}

.legal-list {
  padding-left: 1.2rem;
  color: var(--text-color-secondary);
  line-height: 1.8;
}

.legal-list li + li {
  margin-top: 0.35rem;
}

@media (max-width: 820px) {
  .legal-topbar {
    padding: 0.65rem 1rem;
  }

  .legal-brand-subtitle,
  .legal-topbar-button {
    display: none;
  }

  .legal-main {
    width: min(100% - 1.5rem, 42rem);
    padding-top: 2.4rem;
  }

  .legal-hero {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .legal-meta {
    align-items: flex-start;
    text-align: left;
  }

  .legal-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .legal-layout {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .legal-index {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem 1rem;
  }

  .legal-index-title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .legal-topbar-actions {
    gap: 0.35rem;
  }

  .legal-index {
    grid-template-columns: 1fr;
  }
}
</style>
