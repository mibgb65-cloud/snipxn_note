<template>
  <div class="auth-page">
    <header class="auth-page-header">
      <router-link to="/" class="auth-back-link">
        <span>{{ t('app.name') }}</span>
      </router-link>
      <div class="auth-page-controls">
        <ThemeToggle />
        <LangToggle />
      </div>
    </header>

    <main class="auth-page-main">
      <div class="auth-card animate-fade-in-up">
        <div class="auth-card-title-block">
          <h1 class="auth-card-title">
            {{ currentStep === 'password' ? t('auth.createPasswordTitle') : t('auth.checkInboxTitle') }}
          </h1>
          <p class="auth-card-subtitle">
            {{ currentStep === 'password' ? t('auth.createPasswordSubtitle') : t('auth.checkInboxSubtitle', { email: emailFromQuery }) }}
          </p>
        </div>

        <form v-if="currentStep === 'password'" @submit.prevent="handlePasswordContinue" class="auth-card-form">
          <div class="auth-field">
            <label for="reg-email-display" class="auth-label auth-label-soft">{{ t('auth.email') }}</label>
            <div id="reg-email-display" class="auth-readonly-field">
              <div class="auth-readonly-main">
                <i class="pi pi-envelope" />
                <span>{{ emailFromQuery }}</span>
              </div>
              <button type="button" class="auth-readonly-action" @click="goBackToEntry">
                {{ t('common.edit') }}
              </button>
            </div>
          </div>

          <div class="auth-field">
            <label for="reg-password" class="auth-label auth-label-soft">{{ t('auth.password') }}</label>
            <Password
              id="reg-password"
              v-model="form.password"
              :feedback="false"
              toggleMask
              class="w-full"
              :inputClass="['w-full', { 'p-invalid': Boolean(passwordError) }]"
              autocomplete="new-password"
            />
            <small v-if="passwordError" class="auth-field-error">
              {{ passwordError }}
            </small>
          </div>

          <Button
            :label="t('auth.continueBtn')"
            class="w-full auth-submit"
            type="submit"
            :loading="isCodeSending"
          />

          <div v-if="actionErrorMessage" class="auth-status-banner is-error" role="alert">
            <i class="pi pi-exclamation-circle" />
            <span>{{ actionErrorMessage }}</span>
          </div>

          <div class="auth-legal auth-legal-primary">
            <button type="button" class="auth-legal-link" @click="showLegalToast('terms')">
              {{ t('auth.termsOfService') }}
            </button>
            <span class="auth-legal-separator">|</span>
            <button type="button" class="auth-legal-link" @click="showLegalToast('privacy')">
              {{ t('auth.privacyPolicy') }}
            </button>
          </div>
        </form>

        <form v-else @submit.prevent="handleRegister" class="auth-card-form auth-verify-form">
          <div class="auth-code-group" @paste="handleCodePaste">
            <input
              v-for="(_, index) in codeDigits"
              :key="index"
              :ref="(el) => setCodeInputRef(el, index)"
              :value="codeDigits[index]"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="1"
              class="auth-code-input"
              :class="{ 'is-error': Boolean(codeError) }"
              @input="handleCodeInput(index, $event)"
              @keydown="handleCodeKeydown(index, $event)"
            />
          </div>

          <small v-if="codeError" class="auth-field-error auth-field-error-centered">
            {{ codeError }}
          </small>

          <Button
            :label="t('auth.continueBtn')"
            class="w-full auth-submit"
            type="submit"
            :loading="loading"
          />

          <div v-if="actionErrorMessage" class="auth-status-banner is-error" role="alert">
            <i class="pi pi-exclamation-circle" />
            <span>{{ actionErrorMessage }}</span>
          </div>

          <button
            type="button"
            class="auth-resend-link"
            :disabled="isCodeSending || countdown > 0"
            @click="handleResendCode"
          >
            {{ countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendEmail') }}
          </button>

          <div class="auth-legal">
            <button type="button" class="auth-legal-link" @click="showLegalToast('terms')">
              {{ t('auth.termsOfService') }}
            </button>
            <span class="auth-legal-separator">|</span>
            <button type="button" class="auth-legal-link" @click="showLegalToast('privacy')">
              {{ t('auth.privacyPolicy') }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

import Password from 'primevue/password';
import Button from 'primevue/button';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const toast = useToast();

const emailFromQuery = computed(() => String(route.query.email || '').trim());
const redirectTarget = computed(() => route.query.redirect || null);

const currentStep = ref('password');
const loading = ref(false);
const isCodeSending = ref(false);
const countdown = ref(0);
const submittedPasswordStep = ref(false);
const submittedCodeStep = ref(false);
const hasSentRegisterCode = ref(false);
const actionErrorMessage = ref('');
const codeDigits = ref(Array.from({ length: 6 }, () => ''));
const codeInputRefs = ref([]);
let timer = null;

const form = reactive({
  password: '',
});

const passwordError = computed(() => {
  if (!submittedPasswordStep.value) return '';

  if (!form.password.trim()) {
    return t('auth.passwordRequired');
  }

  if (!isValidPassword(form.password)) {
    return t('auth.passwordRulesHint');
  }

  return '';
});

const codeError = computed(() => {
  if (!submittedCodeStep.value) return '';

  const normalizedCode = codeDigits.value.join('').trim();
  if (!normalizedCode) {
    return t('auth.codeRequired');
  }

  if (!/^\d{6}$/.test(normalizedCode)) {
    return t('auth.codeInvalid');
  }

  return '';
});

watch(
  () => route.query.email,
  () => {
    resetRegistrationFlow();
  },
  { immediate: true },
);

watch(
  () => form.password,
  () => {
    if (currentStep.value === 'password' && actionErrorMessage.value) {
      actionErrorMessage.value = '';
    }
  },
);

watch(
  () => codeDigits.value.join(''),
  () => {
    if (currentStep.value === 'verify' && actionErrorMessage.value) {
      actionErrorMessage.value = '';
    }
  },
);

function extractErrorMessage(error, fallback) {
  const messages = [];

  function pushMessage(value) {
    if (typeof value === 'string' && value.trim()) {
      messages.push(value.trim());
    }
  }

  function inspectPayload(payload) {
    if (!payload) return;

    if (typeof payload === 'string') {
      pushMessage(payload);
      return;
    }

    if (typeof payload !== 'object') {
      return;
    }

    pushMessage(payload.message);
    pushMessage(payload.msg);
    pushMessage(payload.detail);
    pushMessage(payload.error);

    if (Array.isArray(payload.errors)) {
      for (const item of payload.errors) {
        if (typeof item === 'string') {
          pushMessage(item);
          break;
        }

        if (item && typeof item === 'object') {
          pushMessage(item.message);
          pushMessage(item.msg);
          pushMessage(item.defaultMessage);
          pushMessage(item.detail);

          if (messages.length) {
            break;
          }
        }
      }
    }
  }

  inspectPayload(error?.response?.data);
  inspectPayload(error?.data);
  pushMessage(error?.message);

  return messages[0] || fallback;
}

function stopCountdown() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  countdown.value = 0;
}

function startCountdown() {
  stopCountdown();
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      stopCountdown();
    }
  }, 1000);
}

function resetRegistrationFlow() {
  currentStep.value = 'password';
  loading.value = false;
  isCodeSending.value = false;
  submittedPasswordStep.value = false;
  submittedCodeStep.value = false;
  hasSentRegisterCode.value = false;
  actionErrorMessage.value = '';
  form.password = '';
  codeDigits.value = Array.from({ length: 6 }, () => '');
  codeInputRefs.value = [];
  stopCountdown();
}

function goBackToEntry() {
  const query = { auth: 'true' };
  if (redirectTarget.value) {
    query.redirect = redirectTarget.value;
  }
  router.push({ path: '/', query });
}

function isValidPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(value);
}

function setCodeInputRef(el, index) {
  if (el) {
    codeInputRefs.value[index] = el;
  }
}

function focusCodeInput(index = 0) {
  nextTick(() => {
    codeInputRefs.value[index]?.focus?.();
    codeInputRefs.value[index]?.select?.();
  });
}

function applyCodeString(rawValue) {
  const digits = String(rawValue || '').replace(/\D/g, '').slice(0, 6).split('');
  codeDigits.value = Array.from({ length: 6 }, (_, index) => digits[index] || '');
}

function handleCodeInput(index, event) {
  const value = String(event.target.value || '').replace(/\D/g, '');

  if (!value) {
    codeDigits.value[index] = '';
    return;
  }

  if (value.length > 1) {
    applyCodeString(value);
    focusCodeInput(Math.min(value.length, 5));
    return;
  }

  codeDigits.value[index] = value;
  if (index < codeDigits.value.length - 1) {
    focusCodeInput(index + 1);
  }
}

function handleCodeKeydown(index, event) {
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    codeDigits.value[index - 1] = '';
    focusCodeInput(index - 1);
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowLeft' && index > 0) {
    focusCodeInput(index - 1);
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowRight' && index < codeDigits.value.length - 1) {
    focusCodeInput(index + 1);
    event.preventDefault();
  }
}

function handleCodePaste(event) {
  const pastedText = event.clipboardData?.getData('text') || '';
  const digits = pastedText.replace(/\D/g, '').slice(0, 6);
  if (!digits) return;

  event.preventDefault();
  applyCodeString(digits);
  focusCodeInput(digits.length === 6 ? 5 : digits.length);
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

async function handlePasswordContinue() {
  submittedPasswordStep.value = true;
  actionErrorMessage.value = '';

  if (!emailFromQuery.value) {
    goBackToEntry();
    return;
  }

  if (passwordError.value) {
    return;
  }

  if (hasSentRegisterCode.value) {
    currentStep.value = 'verify';
    await nextTick();
    focusCodeInput();
    return;
  }

  isCodeSending.value = true;
  try {
    await authStore.sendCode(emailFromQuery.value, 'REGISTER');
    hasSentRegisterCode.value = true;
    currentStep.value = 'verify';
    submittedCodeStep.value = false;
    actionErrorMessage.value = '';
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('auth.codeSent'),
      life: 3000,
    });
    startCountdown();
    focusCodeInput();
  } catch (err) {
    const detail = extractErrorMessage(err, t('auth.sendCodeFailed'));
    actionErrorMessage.value = detail;
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  } finally {
    isCodeSending.value = false;
  }
}

async function handleResendCode() {
  if (!emailFromQuery.value) return;

  isCodeSending.value = true;
  actionErrorMessage.value = '';
  try {
    await authStore.sendCode(emailFromQuery.value, 'REGISTER');
    actionErrorMessage.value = '';
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('auth.codeSent'),
      life: 3000,
    });
    startCountdown();
  } catch (err) {
    const detail = extractErrorMessage(err, t('auth.sendCodeFailed'));
    actionErrorMessage.value = detail;
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  } finally {
    isCodeSending.value = false;
  }
}

async function handleRegister() {
  submittedCodeStep.value = true;
  submittedPasswordStep.value = true;
  actionErrorMessage.value = '';

  if (!emailFromQuery.value) {
    goBackToEntry();
    return;
  }

  if (passwordError.value) {
    currentStep.value = 'password';
    return;
  }

  if (codeError.value) {
    return;
  }

  loading.value = true;
  try {
    await authStore.register(emailFromQuery.value, codeDigits.value.join('').trim(), form.password);
    actionErrorMessage.value = '';
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('auth.successRegister'),
      life: 3000,
    });
    router.push('/setup-profile');
  } catch (err) {
    const detail = extractErrorMessage(err, t('auth.actionFailed'));
    actionErrorMessage.value = detail;
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  stopCountdown();
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
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 92%, transparent);
}

.auth-page-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(2.5rem, 10vh, 8rem) 1rem 3.25rem;
}

.auth-card {
  width: min(26rem, 100%);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 98%, transparent);
  box-shadow: var(--app-shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.auth-card-title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  text-align: center;
}

.auth-card-title {
  margin: 0;
  font-size: 1.72rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-card-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.6;
}

.auth-card-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-label {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

.auth-label-soft {
  color: var(--text-color-secondary);
  font-weight: 400;
}

.auth-readonly-field {
  min-height: 3.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.85rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
  color: var(--text-color);
  font-size: 0.92rem;
  font-weight: 600;
}

.auth-readonly-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1;
}

.auth-readonly-main .pi {
  color: var(--primary-color);
  font-size: 0.92rem;
}

.auth-readonly-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-readonly-action {
  flex-shrink: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--primary-color);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 180ms;
}

.auth-readonly-action:hover {
  opacity: 0.88;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.auth-status-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.82rem 0.95rem;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 22%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
  color: var(--text-color-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
}

.auth-status-banner .pi {
  margin-top: 0.12rem;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.auth-status-banner.is-error {
  border-color: color-mix(in srgb, var(--red-500) 22%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 9%, var(--app-panel-inset));
  color: color-mix(in srgb, var(--red-500) 78%, var(--text-color));
}

.auth-status-banner.is-error .pi {
  color: var(--red-500);
}

.auth-field-error {
  color: var(--red-500);
  font-size: 0.82rem;
}

.auth-field-error-centered {
  text-align: center;
}

.auth-verify-form {
  gap: 1.1rem;
}

.auth-code-group {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.55rem;
}

.auth-code-input {
  width: 100%;
  aspect-ratio: 0.9 / 1;
  min-height: 3.85rem;
  border: 1px solid var(--app-border);
  border-radius: 1.05rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: var(--text-color);
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: border-color 180ms, box-shadow 180ms, background 180ms, transform 180ms;
}

.auth-code-input:hover {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
}

.auth-code-input:focus {
  outline: none;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 52%, var(--app-border));
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--primary-color) 12%, transparent);
  transform: translateY(-1px);
}

.auth-code-input.is-error {
  border-color: color-mix(in srgb, var(--red-500) 55%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 5%, var(--app-panel-strong));
}

.auth-code-input.is-error:focus {
  border-color: var(--red-500);
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--red-500) 14%, transparent);
}

.auth-resend-link {
  align-self: center;
  border: 0;
  padding: 0;
  background: transparent;
  color: color-mix(in srgb, var(--text-color-secondary) 74%, transparent);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 400;
  cursor: pointer;
  transition: color 180ms, opacity 180ms;
}

.auth-resend-link:hover:not(:disabled) {
  color: var(--text-color-secondary);
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.auth-resend-link:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--text-color-secondary) 54%, transparent);
  opacity: 1;
}

.auth-legal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
}

.auth-legal-primary {
  margin-top: 0.95rem;
}

.auth-legal-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-color-secondary);
  font: inherit;
  cursor: pointer;
  transition: color 180ms;
}

.auth-legal-link:hover {
  color: var(--text-color);
}

.auth-legal-separator {
  opacity: 0.45;
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
  margin-top: 0.35rem;
  font-size: 1rem;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  min-height: 3.1rem;
  border-radius: 0.85rem;
  transition: border-color 180ms, box-shadow 180ms, background 180ms;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-inputtext:hover),
:deep(.p-password-input:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-password-input:enabled:focus) {
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 48%, var(--app-border));
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--primary-color) 12%, transparent);
}

:deep(.p-inputtext.p-invalid),
:deep(.p-password-input.p-invalid) {
  border-color: color-mix(in srgb, var(--red-500) 55%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 4%, var(--app-panel-strong));
}

:deep(.p-inputtext.p-invalid:enabled:focus),
:deep(.p-password-input.p-invalid:enabled:focus) {
  border-color: var(--red-500);
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--red-500) 14%, transparent);
}

.animate-fade-in-up {
  animation: fade-in-up 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .auth-page-main {
    padding: clamp(2.2rem, 11vh, 4.5rem) 1rem 2.75rem;
  }

  .auth-card {
    width: 100%;
    padding: 1.35rem;
  }

  .auth-page-header {
    padding: 0.5rem 0.75rem;
  }

  .auth-code-group {
    gap: 0.4rem;
  }

  .auth-code-input {
    min-height: 3.35rem;
    font-size: 1.1rem;
  }
}
</style>
