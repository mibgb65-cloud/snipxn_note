<template>
  <Dialog
    :visible="modelValue"
    modal
    :closable="true"
    :showHeader="false"
    :style="{ width: 'min(54rem, calc(100vw - 1.5rem))' }"
    :pt="{
      mask: { class: 'auth-modal-mask' },
      root: { class: 'auth-modal-shell' },
      content: { class: 'auth-modal-content' },
    }"
    @update:visible="handleVisibleChange"
  >
    <div class="auth-modal">
      <aside class="auth-context-panel" aria-hidden="true">
        <div class="auth-context-brand">
          <span class="auth-logo-wrap">
            <img :src="logoUrl" alt="" width="30" height="30" />
          </span>
          <div>
            <span class="auth-brand-name">{{ t('app.name') }}</span>
            <span class="auth-context-kicker">{{ t('auth.heroEyebrow') }}</span>
          </div>
        </div>

        <div class="auth-context-copy">
          <h3>{{ t('auth.heroTitle') }}</h3>
          <p>{{ t('auth.heroBody') }}</p>
        </div>

        <div class="auth-context-list">
          <span>
            <i class="pi pi-file-edit" />
            {{ t('auth.featureEditor') }}
          </span>
          <span>
            <i class="pi pi-sync" />
            {{ t('auth.featureSync') }}
          </span>
          <span>
            <i class="pi pi-cloud" />
            {{ t('auth.featureOffline') }}
          </span>
        </div>
      </aside>

      <section class="auth-form-panel">
        <!-- Header -->
        <div class="auth-header">
          <div class="auth-brand">
            <div class="auth-logo-wrap auth-logo-mobile">
              <img :src="logoUrl" alt="Snipxn" width="30" height="30" />
            </div>
            <span class="auth-brand-name auth-brand-name-mobile">{{ t('app.name') }}</span>
          </div>
          <button
            type="button"
            class="auth-close-btn"
            :aria-label="t('common.close')"
            @click="handleVisibleChange(false)"
          >
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
              <div class="auth-email-message-slot">
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
      </section>
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
import { useLogoUrl } from '../../composables/useLogoUrl';

const { logoUrl } = useLogoUrl();

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
  --auth-text: var(--p-text-color, var(--text-color));
  --auth-muted: var(--p-text-muted-color, var(--text-color-secondary));
  --auth-border: var(--app-border);
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(25rem, 1fr);
  min-height: 31rem;
  color: var(--auth-text);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 98%, transparent);
}

.auth-context-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.55rem;
  border-right: 1px solid var(--app-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 6%, transparent), transparent 42%),
    color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 94%, transparent);
}

.auth-context-brand {
  display: flex;
  align-items: center;
  gap: 0.72rem;
}

.auth-context-brand > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.auth-context-kicker {
  color: var(--auth-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.auth-context-copy {
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
}

.auth-context-copy h3 {
  max-width: 19rem;
  margin: 0;
  color: var(--auth-text);
  font-size: 1.25rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.3;
}

.auth-context-copy p {
  max-width: 20rem;
  margin: 0;
  color: var(--auth-muted);
  font-size: 0.86rem;
  line-height: 1.7;
}

.auth-context-list {
  display: grid;
  gap: 0.55rem;
}

.auth-context-list span {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.45rem;
  padding: 0.62rem 0.72rem;
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 70%, transparent);
  color: var(--auth-muted);
  font-size: 0.82rem;
  font-weight: 650;
}

.auth-context-list .pi {
  color: var(--primary-color);
  font-size: 0.88rem;
}

.auth-form-panel {
  min-width: 0;
  padding: 1.45rem 1.55rem 1.55rem;
  display: flex;
  flex-direction: column;
  gap: 1.18rem;
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
  width: 2.55rem;
  height: 2.55rem;
  border-radius: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 88%, transparent);
  border: 1px solid var(--app-border);
}

.auth-logo-mobile,
.auth-brand-name-mobile {
  display: none;
}

.auth-brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.auth-close-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 92%, transparent);
  color: var(--auth-muted);
  font-size: 0.85rem;
  transition: background 180ms, border-color 180ms, color 180ms;
}

.auth-close-btn:hover {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong, var(--surface-card)));
  color: var(--auth-text);
}

.auth-title-block {
  text-align: left;
}

.auth-title {
  margin: 0 0 0.4rem;
  color: var(--auth-text);
  font-size: 1.72rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.auth-subtitle {
  margin: 0;
  color: var(--auth-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* OAuth */
.auth-oauth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.auth-oauth-btn {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 2.875rem;
  padding-inline: 0.72rem !important;
  border-radius: 0.5rem !important;
  border-color: var(--app-border-strong) !important;
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 90%, transparent) !important;
  color: var(--auth-text) !important;
  font-size: 0.86rem !important;
  font-weight: 700 !important;
  white-space: nowrap;
}

.auth-oauth-btn span {
  white-space: nowrap;
}

.auth-oauth-btn:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border-strong)) !important;
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-raised, var(--surface-card))) !important;
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
  color: var(--auth-muted);
  white-space: nowrap;
}

/* Form */
.auth-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 13rem;
  gap: 0;
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

.auth-email-message-slot {
  height: 2.45rem;
  margin-top: 0.5rem;
  overflow: hidden;
}

.auth-field-bubble {
  position: static;
  display: flex;
  align-items: flex-start;
  gap: 0.42rem;
  min-height: 2.3rem;
  max-height: 2.45rem;
  padding: 0.52rem 0.62rem;
  border-radius: 0.48rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 5%, transparent);
  box-shadow: none;
  color: var(--auth-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  overflow: hidden;
  pointer-events: none;
}

.auth-field-bubble::before {
  display: none;
}

.auth-field-bubble .pi {
  margin-top: 0.12rem;
  color: color-mix(in srgb, var(--primary-color) 82%, var(--auth-text));
  font-size: 0.78rem;
  flex-shrink: 0;
}

.auth-field-bubble.is-error {
  border-color: color-mix(in srgb, var(--red-500) 28%, var(--app-border));
  background: color-mix(in srgb, var(--red-500) 9%, transparent);
  color: var(--red-500);
}

.auth-field-bubble.is-error::before {
  display: none;
}

.auth-field-bubble.is-error .pi {
  color: var(--red-500);
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
  margin-top: auto;
  font-size: 1rem;
  border-radius: 0.5rem !important;
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

:deep(.p-inputtext) {
  min-height: 3rem;
  color: var(--auth-text);
  transition: border-color 180ms, box-shadow 180ms, background 180ms;
}

:deep(.p-inputtext::placeholder) {
  color: color-mix(in srgb, var(--auth-muted) 78%, transparent);
  opacity: 1;
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

:global(.auth-modal-shell) {
  border: 1px solid var(--app-border) !important;
  border-radius: 0.85rem !important;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 98%, transparent) !important;
  color: var(--p-text-color, var(--text-color));
  box-shadow: 0 28px 72px -34px rgba(2, 8, 23, 0.46) !important;
}

:global(.auth-modal-shell .p-dialog-content),
:global(.auth-modal-content) {
  padding: 0;
  background: transparent !important;
  color: var(--p-text-color, var(--text-color));
}

:global(.auth-modal-mask) {
  align-items: center !important;
  justify-content: center !important;
  padding: 1rem !important;
  background: color-mix(in srgb, #020617 44%, transparent) !important;
  backdrop-filter: blur(9px) saturate(1.15);
  -webkit-backdrop-filter: blur(9px) saturate(1.15);
}

:global(html.app-dark .auth-modal-shell) {
  --auth-text: #e6eef7;
  --auth-muted: #a9bbcc;
  border-color: rgba(148, 163, 184, 0.22) !important;
  background: #111d2b !important;
  color: var(--auth-text) !important;
  box-shadow: 0 30px 80px -38px rgba(0, 0, 0, 0.82) !important;
}

:global(html.app-dark .auth-modal-shell .p-dialog-content),
:global(html.app-dark .auth-modal-content) {
  color: var(--auth-text) !important;
}

:global(html.app-dark .auth-modal-shell .auth-modal) {
  --auth-text: #e6eef7;
  --auth-muted: #a9bbcc;
  background: #111d2b;
  color: var(--auth-text);
}

:global(html.app-dark .auth-modal-shell .auth-context-panel) {
  border-right-color: rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(45, 212, 191, 0.08), transparent 42%),
    #0d1826;
}

:global(html.app-dark .auth-modal-shell .auth-logo-wrap),
:global(html.app-dark .auth-modal-shell .auth-close-btn),
:global(html.app-dark .auth-modal-shell .auth-oauth-btn),
:global(html.app-dark .auth-modal-shell .auth-context-list span) {
  border-color: rgba(148, 163, 184, 0.2) !important;
  background: rgba(18, 32, 47, 0.92) !important;
  color: var(--auth-text) !important;
}

:global(html.app-dark .auth-modal-shell .auth-title),
:global(html.app-dark .auth-modal-shell .auth-brand-name),
:global(html.app-dark .auth-modal-shell .auth-context-copy h3),
:global(html.app-dark .auth-modal-shell .auth-label) {
  color: var(--auth-text) !important;
}

:global(html.app-dark .auth-modal-shell .auth-subtitle),
:global(html.app-dark .auth-modal-shell .auth-context-copy p),
:global(html.app-dark .auth-modal-shell .auth-context-kicker),
:global(html.app-dark .auth-modal-shell .auth-context-list span),
:global(html.app-dark .auth-modal-shell .auth-divider-text) {
  color: var(--auth-muted) !important;
}

:global(html.app-dark .auth-modal-shell .p-inputtext) {
  border-color: rgba(148, 163, 184, 0.28) !important;
  background: #0c1724 !important;
  color: var(--auth-text) !important;
}

:global(html.app-dark .auth-modal-shell .p-inputtext::placeholder) {
  color: #8fa2b6 !important;
  opacity: 1;
}

:global(html.app-dark .auth-modal-shell .auth-field-bubble) {
  border-color: rgba(45, 212, 191, 0.18);
  background: rgba(45, 212, 191, 0.07);
  color: var(--auth-muted);
}

:global(html.app-dark .auth-modal-shell .auth-field-bubble.is-error) {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
  color: #fca5a5;
}

:global(html.app-dark .auth-modal-shell .auth-submit.p-button) {
  background: #0f766e !important;
  border-color: #0f766e !important;
  color: #ffffff !important;
}

@media (max-width: 760px) {
  .auth-modal {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .auth-context-panel {
    display: none;
  }

  .auth-logo-mobile,
  .auth-brand-name-mobile {
    display: inline-flex;
  }

  .auth-form-panel {
    padding: 1.25rem;
  }

  .auth-title-block {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .auth-modal {
    width: 100%;
  }

  .auth-form-panel {
    padding: 1.05rem 0.9rem;
  }

  .auth-oauth {
    grid-template-columns: 1fr;
  }
}
</style>
