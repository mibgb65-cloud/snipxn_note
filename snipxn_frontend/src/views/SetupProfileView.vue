<template>
  <div class="setup-page animate-fade-in">
    <header class="setup-topbar">
      <router-link to="/" class="setup-brand">
        {{ t('app.name') }}
      </router-link>
      <div class="setup-topbar-actions">
        <ThemeToggle />
        <LangToggle />
      </div>
    </header>

    <main class="setup-main">
      <section class="setup-card animate-fade-in-up">
        <div class="setup-copy">
          <h1 class="setup-title">{{ t('setupProfile.title') }}</h1>
          <p class="setup-body">
            {{ t('setupProfile.subtitlePrefix') }}<button type="button" class="setup-inline-link" @click="showLegalToast('privacy')">{{ t('auth.privacyPolicy') }}</button>{{ t('setupProfile.subtitleSuffix') }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="setup-form">
          <div class="setup-field">
            <label for="nickname" class="setup-label">{{ t('setupProfile.nicknameLabel') }}</label>
            <InputText
              id="nickname"
              v-model="nickname"
              :placeholder="t('setupProfile.nicknamePlaceholder')"
              class="w-full setup-input"
              :invalid="Boolean(nicknameError)"
              autocomplete="nickname"
            />
            <small v-if="nicknameError" class="setup-field-error">{{ nicknameError }}</small>
          </div>

          <div class="setup-field">
            <label for="birthday" class="setup-label">{{ t('setupProfile.birthdayLabel') }}</label>
            <InputText
              id="birthday"
              v-model="birthday"
              type="date"
              :max="todayDate"
              class="w-full setup-input"
              :invalid="Boolean(birthdayError)"
            />
            <small v-if="birthdayError" class="setup-field-error">{{ birthdayError }}</small>
          </div>

          <div v-if="actionErrorMessage" class="setup-status-banner is-error" role="alert">
            <i class="pi pi-exclamation-circle" />
            <span>{{ actionErrorMessage }}</span>
          </div>

          <p class="setup-consent">
            {{ t('setupProfile.consentPrefix') }}<button type="button" class="setup-inline-link" @click="showLegalToast('terms')">{{ t('auth.termsOfService') }}</button>{{ t('setupProfile.consentMiddle') }}<button type="button" class="setup-inline-link" @click="showLegalToast('privacy')">{{ t('auth.privacyPolicy') }}</button>{{ t('setupProfile.consentSuffix') }}
          </p>

          <Button
            :label="t('setupProfile.submit')"
            class="w-full setup-submit"
            type="submit"
            :loading="loading"
          />
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const toast = useToast();

const profileSeed = computed(() => userStore.profile || authStore.user || null);
const nickname = ref('');
const birthday = ref('');
const loading = ref(false);
const submitted = ref(false);
const actionErrorMessage = ref('');
const todayDate = formatDateInput(new Date());

watch(
  profileSeed,
  (profile) => {
    if (!nickname.value) {
      nickname.value = String(profile?.nickname || '').trim();
    }

    if (!birthday.value && profile?.birthday) {
      birthday.value = String(profile.birthday).slice(0, 10);
    }
  },
  { immediate: true },
);

watch(nickname, () => {
  if (actionErrorMessage.value) {
    actionErrorMessage.value = '';
  }
});

watch(birthday, () => {
  if (actionErrorMessage.value) {
    actionErrorMessage.value = '';
  }
});

const nicknameError = computed(() => {
  if (!submitted.value) return '';
  return nickname.value.trim() ? '' : t('setupProfile.nicknameRequired');
});

const birthdayError = computed(() => {
  if (!submitted.value) return '';

  if (!birthday.value) {
    return t('setupProfile.birthdayRequired');
  }

  if (birthday.value > todayDate) {
    return t('setupProfile.birthdayInvalid');
  }

  return '';
});

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showLegalToast(type) {
  const isTerms = type === 'terms';
  toast.add({
    severity: 'info',
    summary: isTerms ? t('auth.termsOfService') : t('auth.privacyPolicy'),
    detail: isTerms ? t('auth.termsComingSoon') : t('auth.privacyComingSoon'),
    life: 2400,
  });
}

async function handleSubmit() {
  submitted.value = true;
  actionErrorMessage.value = '';

  if (nicknameError.value || birthdayError.value) {
    return;
  }

  loading.value = true;
  try {
    await userStore.updateProfile({
      nickname: nickname.value.trim(),
      birthday: birthday.value,
    });

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.saveSuccess'),
      life: 3000,
    });

    router.push('/workspace');
  } catch (err) {
    actionErrorMessage.value = err.message || t('auth.actionFailed');
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: actionErrorMessage.value,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.setup-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg, var(--surface-ground));
  color: var(--text-color);
}

.setup-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--app-border);
}

.setup-brand {
  color: var(--text-color);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.setup-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 92%, transparent);
}

.setup-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: clamp(2.5rem, 10vh, 7rem) 1rem 3rem;
}

.setup-card {
  width: min(28rem, 100%);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 98%, transparent);
  box-shadow: var(--app-shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.setup-copy {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  text-align: center;
}

.setup-title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1.08;
}

.setup-body {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
}

.setup-inline-link {
  border: 0;
  padding: 0;
  margin: 0 0.12rem;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.setup-inline-link:hover {
  color: var(--primary-color);
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setup-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setup-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.setup-field-error {
  color: var(--red-500);
  font-size: 0.82rem;
}

.setup-input {
  min-height: 3.15rem;
}

.setup-consent {
  margin: 0.2rem 0 0;
  color: var(--text-color-secondary);
  font-size: 0.84rem;
  line-height: 1.75;
}

.setup-status-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.82rem 0.95rem;
  border-radius: 0.95rem;
  font-size: 0.84rem;
  line-height: 1.5;
}

.setup-status-banner.is-error {
  border: 1px solid color-mix(in srgb, var(--red-500) 22%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 9%, var(--app-panel-inset));
  color: color-mix(in srgb, var(--red-500) 78%, var(--text-color));
}

.setup-status-banner.is-error .pi {
  margin-top: 0.12rem;
  color: var(--red-500);
  font-size: 0.9rem;
}

.setup-submit {
  min-height: 3.15rem;
  margin-top: 0.15rem;
  font-size: 1rem;
}

:deep(.p-inputtext) {
  min-height: 3.15rem;
  border-radius: 0.85rem;
  transition: border-color 180ms, box-shadow 180ms, background 180ms;
}

:deep(.p-inputtext:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
}

:deep(.p-inputtext:enabled:focus) {
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 48%, var(--app-border));
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--primary-color) 12%, transparent);
}

:deep(.p-inputtext.p-invalid) {
  border-color: color-mix(in srgb, var(--red-500) 55%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 4%, var(--app-panel-strong));
}

.animate-fade-in {
  animation: fade-in 420ms ease both;
}

.animate-fade-in-up {
  animation: fade-in-up 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .setup-topbar {
    padding: 0.5rem 0.75rem;
  }

  .setup-main {
    padding: 2rem 1rem 2.75rem;
  }

  .setup-card {
    width: 100%;
    padding: 1.35rem;
  }

  .setup-title {
    font-size: 1.68rem;
  }
}
</style>
