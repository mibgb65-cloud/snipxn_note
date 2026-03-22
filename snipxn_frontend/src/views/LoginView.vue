<template>
  <div class="login-container animate-fade-in">
    <div class="global-controls animate-fade-in delay-300">
      <Button
        text
        size="small"
        icon="pi pi-arrow-left"
        :label="t('landing.backHome')"
        @click="router.push('/')"
      />
      <div class="flex align-items-center gap-2">
        <ThemeToggle />
        <LangToggle />
      </div>
    </div>

    <div class="login-shell">
      <section class="login-showcase animate-fade-in-up delay-100">
        <div class="showcase-brand">
          <div class="showcase-logo-wrap">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="44" height="44" />
          </div>

          <div class="showcase-brand-copy">
            <div class="showcase-brand-name">{{ t('app.name') }}</div>
            <div class="showcase-brand-subtitle">{{ t('app.subtitle') }}</div>
          </div>
        </div>

        <div class="showcase-copy">
          <div class="showcase-kicker">{{ t('auth.heroEyebrow') }}</div>
          <h1 class="showcase-title">{{ t('auth.heroTitle') }}</h1>
          <p class="showcase-body">{{ t('auth.heroBody') }}</p>
        </div>

        <div class="showcase-chip-row">
          <span v-for="item in featureItems" :key="item.key" class="showcase-chip">
            {{ item.label }}
          </span>
        </div>

        <div class="showcase-feature-list">
          <article v-for="item in featureItems" :key="`card-${item.key}`" class="showcase-feature-card">
            <span class="showcase-feature-icon">
              <i :class="item.icon" />
            </span>
            <span class="showcase-feature-label">{{ item.label }}</span>
          </article>
        </div>

        <blockquote class="showcase-quote">
          {{ t('landing.quote') }}
        </blockquote>
      </section>

      <div class="login-box animate-fade-in-up delay-150">
        <div class="login-box-header">
          <h2 class="login-title">{{ t(`auth.${mode}`) }}</h2>
          <p class="login-subtitle">{{ subtitle }}</p>
        </div>

        <div class="mode-switch" role="tablist" :aria-label="t('auth.login')">
          <button
            type="button"
            class="mode-switch-btn"
            :class="{ 'mode-switch-btn-active': mode === 'login' }"
            @click="setMode('login')"
          >
            {{ t('auth.loginBtn') }}
          </button>
          <button
            type="button"
            class="mode-switch-btn"
            :class="{ 'mode-switch-btn-active': mode === 'register' }"
            @click="setMode('register')"
          >
            {{ t('auth.registerBtn') }}
          </button>
        </div>

        <div v-if="mode === 'forgotPassword'" class="login-mode-indicator">
          {{ t('auth.forgotPassword') }}
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-column gap-3 mt-4">
          <div class="field">
            <label for="email" class="block font-medium mb-2">{{ t('auth.email') }}</label>
            <InputText id="email" v-model="form.email" type="email" class="w-full" required />
          </div>

          <div v-if="mode !== 'login'" class="field animate-fade-in-up delay-100">
            <label for="code" class="block font-medium mb-2">{{ t('auth.code') }}</label>
            <div class="p-inputgroup">
              <InputText id="code" v-model="form.code" type="text" required />
              <Button
                :label="t('auth.sendCode')"
                :disabled="isCodeSending || countdown > 0"
                :loading="isCodeSending"
                @click="sendCode"
              />
            </div>
            <small v-if="countdown > 0" class="block mt-2 login-helper">
              {{ t('auth.resendIn', { seconds: countdown }) }}
            </small>
          </div>

          <div class="field animate-fade-in-up">
            <label for="password" class="block font-medium mb-2">
              {{ mode === 'forgotPassword' ? t('auth.newPassword') : t('auth.password') }}
            </label>
            <Password
              id="password"
              v-model="form.password"
              :feedback="mode !== 'login'"
              toggleMask
              class="w-full"
              inputClass="w-full"
              required
            />
          </div>

          <div v-if="mode === 'login'" class="flex align-items-center justify-content-between mb-2 login-row animate-fade-in-up">
            <div class="flex align-items-center">
              <Checkbox id="remember" v-model="form.remember" :binary="true" class="mr-2" />
              <label for="remember">{{ t('auth.rememberMe') }}</label>
            </div>
            <button
              type="button"
              class="link-button"
              @click="setMode('forgotPassword')"
            >
              {{ t('auth.forgotPassword') }}
            </button>
          </div>

          <Button :label="submitBtnLabel" class="w-full login-submit animate-fade-in-up delay-100" type="submit" :loading="loading" />

          <div class="text-center mt-4 login-footer animate-fade-in-up delay-200">
            <span v-if="mode === 'login'">
              {{ t('auth.noAccount') }}
              <button
                type="button"
                class="link-button ml-2"
                @click="setMode('register')"
              >
                {{ t('auth.registerBtn') }}
              </button>
            </span>
            <span v-else>
              {{ t('auth.hasAccount') }}
              <button
                type="button"
                class="link-button ml-2"
                @click="setMode('login')"
              >
                {{ t('auth.loginBtn') }}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import logoUrl from '../assets/logo.svg';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const mode = ref('login');
const loading = ref(false);
const isCodeSending = ref(false);
const countdown = ref(0);
let timer = null;

const form = reactive({
  email: '',
  password: '',
  code: '',
  remember: false
});

const submitBtnLabel = computed(() => {
  if (mode.value === 'login') return t('auth.loginBtn');
  if (mode.value === 'register') return t('auth.registerBtn');
  return t('auth.resetBtn');
});

const subtitle = computed(() => {
  if (mode.value === 'login') return t('auth.loginSubtitle');
  if (mode.value === 'register') return t('auth.registerSubtitle');
  return t('auth.forgotPasswordSubtitle');
});

const featureItems = computed(() => ([
  { key: 'editor', icon: 'pi pi-file-edit', label: t('auth.featureEditor') },
  { key: 'sync', icon: 'pi pi-desktop', label: t('auth.featureSync') },
  { key: 'offline', icon: 'pi pi-cloud-download', label: t('auth.featureOffline') },
]));

const getPostAuthRoute = () => {
  const redirect = route.query.redirect;

  return typeof redirect === 'string' && redirect ? redirect : '/workspace';
};

const setMode = (newMode) => {
  mode.value = newMode;
  form.password = '';
  form.code = '';
};

const startCountdown = () => {
  if (timer) {
    clearInterval(timer);
  }

  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
};

const sendCode = async () => {
  if (!form.email) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('auth.emailRequired'),
      life: 3000,
    });
    return;
  }

  isCodeSending.value = true;

  try {
    const scene = mode.value === 'register' ? 'REGISTER' : 'RESET_PASSWORD';
    await authStore.sendCode(form.email, scene);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('auth.codeSent'),
      life: 3000,
    });
    startCountdown();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: err.message || t('auth.sendCodeFailed'),
      life: 3000,
    });
  } finally {
    isCodeSending.value = false;
  }
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    if (mode.value === 'login') {
      await authStore.login(form.email, form.password);
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.successLogin'), life: 3000 });
      router.push(getPostAuthRoute());
    } else if (mode.value === 'register') {
      await authStore.register(form.email, form.code, form.password);
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.successRegister'), life: 3000 });
      router.push(getPostAuthRoute());
    } else if (mode.value === 'forgotPassword') {
      await authStore.resetPassword(form.email, form.code, form.password);
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.successReset'), life: 3000 });
      setMode('login');
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: err.message || t('auth.actionFailed'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  padding: 1.5rem;
  position: relative;
  background: transparent;
  display: flex;
  align-items: center;
}

.global-controls {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.login-shell {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 440px);
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.login-showcase,
.login-box {
  border: 1px solid var(--app-border);
  border-radius: 2rem;
  backdrop-filter: blur(18px);
  box-shadow: var(--app-shadow);
}

.login-showcase {
  padding: clamp(2rem, 4vw, 3rem);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--primary-color) 12%, transparent) 0%, transparent 32%),
    linear-gradient(160deg, var(--app-panel-strong), color-mix(in srgb, var(--app-panel) 92%, transparent));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.6rem;
}

.showcase-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.showcase-logo-wrap {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--app-panel-strong) 92%, transparent);
  border: 1px solid var(--app-border);
}

.showcase-brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.showcase-brand-subtitle {
  margin-top: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
}

.showcase-kicker {
  color: var(--primary-color);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.showcase-title {
  margin: 0.9rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 5vw, 4.6rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.showcase-body {
  margin: 1rem 0 0;
  max-width: 42rem;
  color: var(--text-color-secondary);
  font-size: 1rem;
  line-height: 1.8;
}

.showcase-chip-row,
.showcase-feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.showcase-chip,
.showcase-feature-card {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
}

.showcase-chip {
  padding: 0.5rem 0.8rem;
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  font-family: var(--font-mono);
}

.showcase-feature-card {
  padding: 0.8rem 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-color);
  font-weight: 700;
}

.showcase-feature-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
}

.showcase-feature-label {
  font-size: 0.92rem;
}

.showcase-quote {
  margin: 0;
  padding: 1.25rem 1.35rem;
  border-left: 4px solid color-mix(in srgb, var(--primary-color) 45%, transparent);
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
  color: var(--text-color);
  font-size: 1.02rem;
  line-height: 1.75;
}

.login-box {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, var(--app-panel-strong), color-mix(in srgb, var(--app-panel) 94%, transparent));
  padding: clamp(2rem, 3vw, 2.75rem);
  display: flex;
  flex-direction: column;
}

.login-box-header {
  margin-bottom: 1rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  letter-spacing: -0.04em;
}

.login-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.4rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  border: 1px solid var(--app-border);
}

.mode-switch-btn {
  min-height: 2.7rem;
  border: 0;
  border-radius: 0.8rem;
  background: transparent;
  color: var(--text-color-secondary);
  font-weight: 700;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.mode-switch-btn:hover {
  color: var(--text-color);
}

.mode-switch-btn-active {
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: var(--text-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.login-mode-indicator {
  margin-top: 0.9rem;
  width: fit-content;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  font-size: 0.78rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.login-helper {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.login-row,
.login-footer {
  color: var(--text-color-secondary);
  font-size: 0.95rem;
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

.login-submit {
  margin-top: 1rem;
  font-size: 1.05rem;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  min-height: 3.25rem;
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

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-box {
    order: -1;
  }
}

@media (max-width: 640px) {
  .login-container {
    padding: 1rem;
  }

  .login-box {
    padding: 1.5rem;
  }

  .login-showcase {
    padding: 1.5rem;
  }

  .showcase-title {
    font-size: 2.8rem;
  }

  .global-controls {
    top: 1rem;
    left: 1rem;
    right: 1rem;
  }

  .mode-switch {
    grid-template-columns: 1fr;
  }
}
</style>
