<template>
  <div class="auth-page">
    <!-- Top controls -->
    <header class="auth-page-header">
      <router-link to="/" class="auth-back-link">
        <i class="pi pi-arrow-left" />
        <span>{{ t('app.name') }}</span>
      </router-link>
      <div class="auth-page-controls">
        <ThemeToggle />
        <LangToggle />
      </div>
    </header>

    <main class="auth-page-main">
      <div class="auth-card animate-fade-in-up">
        <!-- Logo -->
        <div class="auth-card-brand">
          <div class="auth-logo-wrap">
            <img :src="logoUrl" alt="Snipxn" width="32" height="32" />
          </div>
        </div>

        <!-- Title -->
        <div class="auth-card-title-block">
          <h1 class="auth-card-title">{{ isForgotMode ? t('auth.forgotPassword') : t('auth.login') }}</h1>
          <p class="auth-card-subtitle">
            {{ isForgotMode ? t('auth.forgotPasswordSubtitle') : t('auth.loginSubtitle') }}
          </p>
        </div>

        <!-- Email display -->
        <div class="auth-email-display" @click="goBackToEntry">
          <i class="pi pi-envelope" />
          <span class="auth-email-text">{{ emailFromQuery }}</span>
          <button type="button" class="auth-email-change">
            <i class="pi pi-pencil" />
            {{ t('auth.backToEmailEntry') }}
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="!isForgotMode" @submit.prevent="handleLogin" class="auth-card-form">
          <div class="field">
            <label for="login-password" class="block font-medium mb-2">{{ t('auth.password') }}</label>
            <Password
              id="login-password"
              v-model="form.password"
              :feedback="false"
              toggleMask
              class="w-full"
              inputClass="w-full"
              required
            />
          </div>

          <div class="flex align-items-center justify-content-between mb-2 auth-row">
            <div class="flex align-items-center">
              <Checkbox id="login-remember" v-model="form.remember" :binary="true" class="mr-2" />
              <label for="login-remember">{{ t('auth.rememberMe') }}</label>
            </div>
            <button type="button" class="link-button" @click="isForgotMode = true">
              {{ t('auth.forgotPassword') }}
            </button>
          </div>

          <Button :label="t('auth.loginBtn')" class="w-full auth-submit" type="submit" :loading="loading" />

          <div class="text-center mt-3 auth-footer">
            <span>{{ t('auth.noAccount') }}</span>
            <router-link :to="{ path: '/register', query: registerQuery }" class="link-button ml-2">
              {{ t('auth.registerBtn') }}
            </router-link>
          </div>
        </form>

        <!-- Forgot Password Form -->
        <form v-else @submit.prevent="handleReset" class="auth-card-form">
          <div class="field">
            <label for="reset-code" class="block font-medium mb-2">{{ t('auth.code') }}</label>
            <div class="p-inputgroup">
              <InputText id="reset-code" v-model="form.code" type="text" required />
              <Button
                :label="countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.sendCode')"
                :disabled="isCodeSending || countdown > 0"
                :loading="isCodeSending"
                @click="handleSendCode"
              />
            </div>
          </div>

          <div class="field">
            <label for="reset-password" class="block font-medium mb-2">{{ t('auth.newPassword') }}</label>
            <Password
              id="reset-password"
              v-model="form.newPassword"
              :feedback="true"
              toggleMask
              class="w-full"
              inputClass="w-full"
              required
            />
          </div>

          <Button :label="t('auth.resetBtn')" class="w-full auth-submit" type="submit" :loading="loading" />

          <div class="text-center mt-3 auth-footer">
            <button type="button" class="link-button" @click="isForgotMode = false">
              {{ t('auth.loginBtn') }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

import Password from 'primevue/password';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import { useLogoUrl } from '../composables/useLogoUrl';

const { logoUrl } = useLogoUrl();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const toast = useToast();

const emailFromQuery = computed(() => route.query.email || '');
const redirectTarget = computed(() => route.query.redirect || null);

const registerQuery = computed(() => {
  const q = { email: emailFromQuery.value };
  if (redirectTarget.value) q.redirect = redirectTarget.value;
  return q;
});

const isForgotMode = ref(false);
const loading = ref(false);
const isCodeSending = ref(false);
const countdown = ref(0);
let timer = null;

const form = reactive({
  password: '',
  remember: false,
  code: '',
  newPassword: '',
});

function goBackToEntry() {
  router.push({ path: '/', query: { auth: 'true' } });
}

function getPostAuthRoute() {
  if (!authStore.user?.nickname) return '/setup-profile';
  return redirectTarget.value || '/workspace';
}

function startCountdown() {
  if (timer) clearInterval(timer);
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

async function handleSendCode() {
  if (!emailFromQuery.value) return;
  isCodeSending.value = true;
  try {
    await authStore.sendCode(emailFromQuery.value, 'RESET_PASSWORD');
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.codeSent'), life: 3000 });
    startCountdown();
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err.message || t('auth.sendCodeFailed'), life: 3000 });
  } finally {
    isCodeSending.value = false;
  }
}

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login(emailFromQuery.value, form.password);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.successLogin'), life: 3000 });
    router.push(getPostAuthRoute());
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err.message || t('auth.actionFailed'), life: 3000 });
  } finally {
    loading.value = false;
  }
}

async function handleReset() {
  loading.value = true;
  try {
    await authStore.resetPassword(emailFromQuery.value, form.code, form.newPassword);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.successReset'), life: 3000 });
    isForgotMode.value = false;
    form.code = '';
    form.newPassword = '';
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err.message || t('auth.actionFailed'), life: 3000 });
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg, var(--surface-ground));
  color: var(--text-color);
}

.auth-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--app-border);
}

.auth-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 0.95rem;
  transition: color 180ms;
}

.auth-back-link:hover {
  color: var(--primary-color);
}

.auth-page-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 92%, transparent);
}

.auth-page-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: min(26rem, 100%);
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 98%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-card-brand {
  display: flex;
  justify-content: center;
}

.auth-logo-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--app-panel-strong) 92%, transparent);
  border: 1px solid var(--app-border);
}

.auth-card-title-block {
  text-align: center;
}

.auth-card-title {
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-card-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
  line-height: 1.6;
}

/* Email display */
.auth-email-display {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  cursor: pointer;
  transition: border-color 180ms;
}

.auth-email-display:hover {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--app-border));
}

.auth-email-display .pi-envelope {
  color: var(--primary-color);
  font-size: 0.9rem;
}

.auth-email-text {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-email-change {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--primary-color);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.auth-email-change:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Form */
.auth-card-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.auth-row,
.auth-footer {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.link-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--primary-color);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s;
}

.link-button:hover {
  opacity: 0.92;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.auth-submit {
  margin-top: 0.5rem;
  font-size: 1rem;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  min-height: 3rem;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-password-input:enabled:focus) {
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
}

:deep(.p-inputgroup .p-inputtext) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

:deep(.p-inputgroup .p-button) {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}

/* Animations */
.animate-fade-in-up {
  animation: fade-in-up 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.25rem;
    border: none;
    background: transparent;
  }

  .auth-page-header {
    padding: 0.5rem 0.75rem;
  }
}
</style>
