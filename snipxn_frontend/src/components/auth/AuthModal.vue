<template>
  <Dialog
    :visible="modelValue"
    modal
    :closable="true"
    :showHeader="false"
    :style="{ width: 'min(24rem, calc(100vw - 1.5rem))' }"
    :pt="{
      mask: { class: 'auth-modal-mask' },
      root: { class: 'auth-modal-shell' },
      content: { class: 'auth-modal-content' },
    }"
    @update:visible="handleVisibleChange"
  >
    <div class="auth-modal">
      <!-- Header -->
      <div class="auth-header">
        <div class="auth-brand">
          <div class="auth-logo-wrap">
            <img :src="logoUrl" alt="Snipxn" width="32" height="32" />
          </div>
          <span class="auth-brand-name">{{ t('app.name') }}</span>
        </div>
        <button type="button" class="auth-close-btn" @click="handleVisibleChange(false)">
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Title -->
      <div class="auth-title-block">
        <h2 class="auth-title">{{ t('auth.loginOrRegister') }}</h2>
        <p class="auth-subtitle">{{ t('auth.loginOrRegisterSubtitle') }}</p>
      </div>

      <!-- OAuth Placeholder -->
      <div class="auth-oauth">
        <Button
          outlined
          class="w-full auth-oauth-btn"
          @click="handleOAuthLogin('google')"
        >
          <svg class="auth-oauth-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{{ t('auth.continueWithGoogle') }}</span>
        </Button>
        <Button
          outlined
          class="w-full auth-oauth-btn"
          @click="handleOAuthLogin('github')"
        >
          <i class="pi pi-github auth-oauth-icon-pi" />
          <span>{{ t('auth.continueWithGithub') }}</span>
        </Button>
      </div>

      <!-- Divider -->
      <div class="auth-divider">
        <span class="auth-divider-line" />
        <span class="auth-divider-text">{{ t('auth.orContinueWithEmail') }}</span>
        <span class="auth-divider-line" />
      </div>

      <!-- Email Form -->
      <form @submit.prevent="handleContinue" class="auth-form" novalidate>
        <div class="field">
          <label for="auth-email" class="auth-label">{{ t('auth.email') }}</label>
          <div class="auth-input-wrap">
            <InputText
              id="auth-email"
              v-model="email"
              type="text"
              class="w-full"
              inputmode="email"
              autocomplete="email"
              :invalid="Boolean(emailError)"
              :placeholder="t('auth.enterEmail')"
              spellcheck="false"
              :aria-describedby="showEmailBubble ? 'auth-email-message' : null"
              :aria-invalid="emailError ? 'true' : 'false'"
              @focus="emailFocused = true"
              @blur="handleEmailBlur"
            />
            <transition name="auth-email-bubble">
              <div
                v-if="showEmailBubble"
                id="auth-email-message"
                class="auth-field-bubble"
                :class="{ 'is-error': emailError }"
                aria-live="polite"
              >
                <i :class="emailError ? 'pi pi-exclamation-circle' : 'pi pi-at'" />
                <span>{{ emailError || t('auth.emailHint') }}</span>
              </div>
            </transition>
          </div>
        </div>

        <Button
          :label="t('auth.continueBtn')"
          class="w-full auth-submit"
          type="submit"
          :loading="loading"
          icon="pi pi-arrow-right"
          icon-pos="right"
        />
      </form>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { checkEmail } from '../../api/auth';

import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import logoUrl from '../../assets/logo.svg';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  redirect: { type: String, default: null },
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const router = useRouter();
const toast = useToast();

const email = ref('');
const emailFocused = ref(false);
const emailTouched = ref(false);
const loading = ref(false);

const emailError = computed(() => {
  if (!emailTouched.value) return '';

  const normalizedEmail = email.value.trim();
  if (!normalizedEmail) return t('auth.emailRequired');
  if (!isValidEmail(normalizedEmail)) return t('auth.emailInvalid');
  return '';
});

const showEmailBubble = computed(() => emailFocused.value || Boolean(emailError.value));

function handleVisibleChange(val) {
  if (!val) {
    emailFocused.value = false;
    emailTouched.value = false;
  }
  emit('update:modelValue', val);
}

function handleEmailBlur() {
  emailFocused.value = false;
  emailTouched.value = true;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function handleOAuthLogin(provider) {
  const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

  if (provider === 'github') {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.add({ severity: 'info', summary: 'GitHub', detail: t('auth.oauthComingSoon', { provider: 'GitHub' }), life: 3000 });
      return;
    }
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  } else if (provider === 'google') {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.add({ severity: 'info', summary: 'Google', detail: t('auth.oauthComingSoon', { provider: 'Google' }), life: 3000 });
      return;
    }
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
  }
}

async function handleContinue() {
  emailTouched.value = true;
  const normalizedEmail = email.value.trim();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    document.getElementById('auth-email')?.focus();
    return;
  }

  email.value = normalizedEmail;
  loading.value = true;
  try {
    const res = await checkEmail(normalizedEmail);
    const exists = res.data;

    // Build query
    const query = { email: normalizedEmail };
    if (props.redirect) query.redirect = props.redirect;

    // Navigate first — the route change will unmount the modal naturally.
    // Do NOT emit close before push, because LandingView's watch would
    // fire router.replace({ query: {} }) and cancel our navigation.
    const target = exists ? '/login' : '/register';
    await router.push({ path: target, query });
    emit('update:modelValue', false);
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err.message || t('auth.actionFailed'), life: 3000 });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-modal {
  padding: 1.4rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.auth-logo-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--app-panel-strong) 92%, transparent);
  border: 1px solid var(--app-border);
}

.auth-brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.auth-close-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  transition: background 180ms, color 180ms;
}

.auth-close-btn:hover {
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--text-color);
}

.auth-title-block {
  text-align: center;
}

.auth-title {
  margin: 0 0 0.35rem;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* OAuth */
.auth-oauth {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.auth-oauth-btn {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 2.875rem;
  font-weight: 600 !important;
}

.auth-oauth-icon {
  flex-shrink: 0;
}

.auth-oauth-icon-pi {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth-divider-line {
  flex: 1;
  height: 1px;
  background: var(--app-border);
}

.auth-divider-text {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-label {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.auth-input-wrap {
  position: relative;
}

.auth-field-bubble {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  right: 0;
  z-index: 8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, var(--surface-card));
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
  pointer-events: none;
}

.auth-field-bubble::before {
  content: '';
  position: absolute;
  top: -0.38rem;
  left: 1rem;
  width: 0.72rem;
  height: 0.72rem;
  border-top: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  border-left: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, var(--surface-card));
  transform: rotate(45deg);
}

.auth-field-bubble .pi {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.auth-field-bubble.is-error {
  border-color: color-mix(in srgb, var(--red-500) 28%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 11%, var(--app-panel-strong));
  color: var(--red-500);
}

.auth-field-bubble.is-error::before {
  border-top-color: color-mix(in srgb, var(--red-500) 28%, var(--app-border));
  border-left-color: color-mix(in srgb, var(--red-500) 28%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 11%, var(--app-panel-strong));
}

.auth-email-bubble-enter-active,
.auth-email-bubble-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.auth-email-bubble-enter-from,
.auth-email-bubble-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}

.auth-submit {
  margin-top: 0.5rem;
  font-size: 1rem;
}

:deep(.p-inputtext) {
  min-height: 3rem;
  transition: border-color 180ms, box-shadow 180ms, background 180ms;
}

:deep(.p-inputtext:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
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

:deep(.p-inputtext.p-invalid:enabled:focus) {
  border-color: var(--red-500);
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--red-500) 14%, transparent);
}

:deep(.auth-modal-shell .p-dialog-content),
:deep(.auth-modal-content) {
  padding: 0;
}

@media (max-width: 480px) {
  .auth-modal {
    padding: 1.05rem 0.9rem;
  }
}
</style>
