<template>
  <div class="settings-page-shell animate-fade-in">
    <header class="settings-page-topbar animate-fade-in-up delay-100">
      <div class="settings-page-brand">
        <div class="settings-page-brand-icon">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="36" height="36">
        </div>

        <div class="settings-page-brand-copy">
          <div class="settings-page-eyebrow">{{ t('app.name') }}</div>
          <h1 class="settings-page-title">{{ t('settings.title') }}</h1>
          <p class="settings-page-subtitle">{{ t('settings.description') }}</p>
        </div>
      </div>

      <div class="settings-page-actions">
        <div class="settings-page-control-group">
          <ThemeToggle />
          <LangToggle />
        </div>

        <Button
          icon="pi pi-arrow-left"
          :label="t('settings.backToWorkspace')"
          severity="secondary"
          outlined
          @click="router.push('/workspace')"
        />
      </div>
    </header>

    <main class="settings-page-main animate-fade-in-up delay-150">
      <section class="settings-page-overview">
        <article class="settings-page-profile-card">
          <div class="settings-page-kicker">{{ t('settings.profile') }}</div>
          <h2 class="settings-page-profile-name">{{ profileHeading }}</h2>
          <p class="settings-page-profile-copy">{{ profileSubcopy }}</p>
        </article>

        <article class="settings-page-meta-card">
          <span class="settings-page-meta-label">{{ t('settings.devices') }}</span>
          <strong class="settings-page-meta-value">{{ userStore.devices.length }}</strong>
        </article>

        <article class="settings-page-meta-card">
          <span class="settings-page-meta-label">{{ t('storage.title') }}</span>
          <strong class="settings-page-meta-value">{{ storageSummary }}</strong>
        </article>
      </section>

      <section class="settings-page-panel">
        <SettingsPanel />
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
import SettingsPanel from '../components/settings/SettingsPanel.vue';
import logoUrl from '../assets/logo.svg';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/user';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const userStore = useUserStore();

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
  || t('app.subtitle')
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
</script>

<style scoped>
.settings-page-shell {
  min-height: 100vh;
  padding: clamp(1.1rem, 1.3vw, 1.6rem);
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-ground) 92%, white), var(--surface-ground));
}

.settings-page-topbar,
.settings-page-panel,
.settings-page-profile-card,
.settings-page-meta-card {
  border: 1px solid color-mix(in srgb, var(--surface-border) 84%, var(--primary-color));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
  box-shadow: var(--app-shadow-soft);
}

.settings-page-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem 1.1rem;
  border-radius: 1.35rem;
}

.settings-page-brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.settings-page-brand-icon {
  width: 3.15rem;
  height: 3.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
  flex-shrink: 0;
}

.settings-page-brand-copy {
  min-width: 0;
}

.settings-page-eyebrow,
.settings-page-kicker,
.settings-page-meta-label {
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-page-title,
.settings-page-profile-name {
  margin: 0;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.settings-page-title {
  font-size: clamp(1.55rem, 2vw, 2.1rem);
}

.settings-page-subtitle,
.settings-page-profile-copy {
  margin: 0.35rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.settings-page-actions,
.settings-page-control-group,
.settings-page-overview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-page-main {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-page-overview {
  align-items: stretch;
}

.settings-page-profile-card,
.settings-page-meta-card {
  border-radius: 1.3rem;
}

.settings-page-profile-card {
  flex: 1 1 auto;
  padding: 1.3rem 1.4rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 96%, transparent));
}

.settings-page-profile-name {
  margin-top: 0.45rem;
  font-size: clamp(1.35rem, 2vw, 1.85rem);
}

.settings-page-meta-card {
  min-width: 15rem;
  padding: 1.2rem 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.65rem;
}

.settings-page-meta-value {
  font-size: 1.3rem;
  line-height: 1.35;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.settings-page-panel {
  padding: 1rem;
  border-radius: 1.35rem;
}

@media (max-width: 1080px) {
  .settings-page-topbar,
  .settings-page-actions,
  .settings-page-overview {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-page-meta-card {
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .settings-page-shell {
    padding: 0.85rem;
  }

  .settings-page-topbar,
  .settings-page-panel,
  .settings-page-profile-card,
  .settings-page-meta-card {
    border-radius: 1rem;
  }

  .settings-page-brand {
    align-items: flex-start;
  }
}
</style>
