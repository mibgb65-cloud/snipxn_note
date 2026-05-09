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
        <form v-else @submit.prevent="handleReset" class="auth-card-form auth-reset-form">
          <div class="field auth-code-field">
            <label for="reset-code" class="block font-medium mb-2">{{ t('auth.code') }}</label>
            <div class="auth-code-row">
              <InputText id="reset-code" v-model="form.code" type="text" required class="auth-code-input" />
              <Button
                :label="countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.sendCode')"
                class="auth-code-button"
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
              :feedback="false"
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
  --auth-page-bg: #f7fafc;
  --auth-page-header: rgba(255, 255, 255, 0.9);
  --auth-page-field: #ffffff;
  --auth-page-input: #ffffff;
  --auth-page-logo-bg: #f2f7f6;
  --auth-page-code-button: #eef7f6;
  --auth-page-code-button-hover: #dff1ef;
  --auth-page-text: #102033;
  --auth-page-muted: #516173;
  --auth-page-subtle: #7a899a;
  --auth-page-border: rgba(15, 23, 42, 0.1);
  --auth-page-border-strong: rgba(15, 23, 42, 0.16);
  --auth-page-link: #0f766e;
  --auth-page-link-hover: #115e59;
  --auth-page-icon: #0f766e;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, rgba(236, 244, 246, 0.72), transparent 26rem),
    var(--auth-page-bg);
  color: var(--auth-page-text);
}

:global(html.app-dark) .auth-page {
  --auth-page-bg: #050d16;
  --auth-page-header: rgba(5, 13, 22, 0.88);
  --auth-page-field: #0f1b29;
  --auth-page-input: #0f1b29;
  --auth-page-logo-bg: #102032;
  --auth-page-code-button: #102032;
  --auth-page-code-button-hover: #173047;
  --auth-page-text: #f3f7fb;
  --auth-page-muted: #b7c6d6;
  --auth-page-subtle: #8ea3b8;
  --auth-page-border: rgba(148, 163, 184, 0.18);
  --auth-page-border-strong: rgba(148, 163, 184, 0.3);
  --auth-page-link: #7dd3fc;
  --auth-page-link-hover: #bae6fd;
  --auth-page-icon: #5eead4;
  background: var(--auth-page-bg);
}

.auth-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.78rem 1.25rem;
  border-bottom: 1px solid var(--auth-page-border);
  background: var(--auth-page-header);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.auth-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--auth-page-text) !important;
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
  border: 1px solid var(--auth-page-border);
  background: var(--auth-page-field);
}

.auth-page-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(3rem, 10vh, 6.5rem) 1.25rem 3rem;
}

.auth-card {
  width: min(28rem, 100%);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-card-brand {
  display: flex;
  justify-content: center;
}

.auth-logo-wrap {
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--auth-page-logo-bg);
  border: 1px solid var(--auth-page-border);
}

.auth-card-title-block {
  text-align: center;
}

.auth-card-title {
  margin: 0 0 0.35rem;
  color: var(--auth-page-text) !important;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-card-subtitle {
  margin: 0;
  color: var(--auth-page-muted) !important;
  font-size: 0.88rem;
  line-height: 1.6;
}

/* Email display */
.auth-email-display {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.42rem;
  border: 1px solid var(--auth-page-border);
  background: var(--auth-page-field);
  cursor: pointer;
  transition: border-color 180ms;
}

.auth-email-display:hover {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--app-border));
}

.auth-email-display .pi-envelope {
  color: var(--auth-page-icon);
  font-size: 0.9rem;
}

.auth-email-text {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--auth-page-text) !important;
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
  color: var(--auth-page-link);
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
  gap: 0.95rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--auth-page-border);
}

.auth-reset-form {
  gap: 1rem;
}

.auth-row,
.auth-footer {
  color: var(--auth-page-muted) !important;
  font-size: 0.9rem;
}

.field label,
.auth-row label {
  color: var(--auth-page-text) !important;
}

.auth-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--auth-page-border-strong);
  border-radius: 0.42rem;
  background: var(--auth-page-input);
  transition: border-color 180ms, box-shadow 180ms;
}

.auth-code-row:focus-within {
  border-color: color-mix(in srgb, var(--auth-page-link) 48%, var(--auth-page-border));
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--auth-page-link) 12%, transparent);
}

.auth-code-row :deep(.auth-code-input.p-inputtext) {
  min-height: 3rem;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.auth-code-button.p-button {
  min-width: 6.4rem;
  border: 0 !important;
  border-left: 1px solid var(--auth-page-border-strong) !important;
  border-radius: 0 !important;
  background: var(--auth-page-code-button) !important;
  color: var(--auth-page-text) !important;
  font-size: 0.88rem;
  font-weight: 800 !important;
  white-space: nowrap;
}

.auth-code-button.p-button:enabled:hover {
  background: var(--auth-page-code-button-hover) !important;
  color: var(--auth-page-text) !important;
}

.auth-code-button.p-button:disabled {
  background: var(--auth-page-field) !important;
  color: var(--auth-page-subtle) !important;
  opacity: 1;
}

.link-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--auth-page-link);
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

.auth-submit.p-button {
  background: #0f766e !important;
  border-color: #0f766e !important;
  color: #ffffff !important;
  font-weight: 800 !important;
}

.auth-submit.p-button:enabled:hover {
  background: #115e59 !important;
  border-color: #115e59 !important;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  min-height: 3rem;
  border-radius: 0.42rem;
  border-color: var(--auth-page-border-strong) !important;
  background: var(--auth-page-input) !important;
  color: var(--auth-page-text) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-password-input::placeholder) {
  color: var(--auth-page-subtle) !important;
  opacity: 1;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-password-input:enabled:focus) {
  background: var(--auth-page-input) !important;
  border-color: color-mix(in srgb, var(--auth-page-link) 48%, var(--auth-page-border)) !important;
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--auth-page-link) 12%, transparent) !important;
}

:global(html.app-dark) .auth-card {
  box-shadow: none;
}

:global(html.app-dark) .auth-logo-wrap {
  background: #132235;
}

:global(html.app-dark) .auth-email-display,
:global(html.app-dark) .auth-page-controls {
  background: #0b1622;
}

:global(html.app-dark) .auth-card-title,
:global(html.app-dark) .field label,
:global(html.app-dark) .auth-row label,
:global(html.app-dark) .auth-email-text {
  color: #f3f7fb;
}

:global(html.app-dark) .auth-card-subtitle,
:global(html.app-dark) .auth-row,
:global(html.app-dark) .auth-footer {
  color: #b7c6d6;
}

:global(html.app-dark) .auth-submit.p-button {
  background: #0f766e !important;
  border-color: #0f766e !important;
  color: #ffffff !important;
}

:global(html.app-dark) :deep(.p-password-input),
:global(html.app-dark) :deep(.p-inputtext) {
  color: #f3f7fb !important;
}

:global(html.app-dark) :deep(.p-password .p-icon),
:global(html.app-dark) :deep(.p-password-toggle-mask) {
  color: #a9bbcc;
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
    border: none;
    background: transparent;
  }

  .auth-page-header {
    padding: 0.5rem 0.75rem;
  }
}
</style>
