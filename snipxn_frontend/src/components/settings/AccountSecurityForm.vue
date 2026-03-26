<template>
  <section class="settings-section">
    <!-- Password Change -->
    <div class="security-block">
      <div class="security-block-header">
        <h4 class="security-block-title">{{ t('security.passwordTitle') }}</h4>
        <p class="security-block-description">{{ t('security.passwordDescription') }}</p>
      </div>

      <div class="password-form-card">
        <div class="grid form-grid">
          <div class="col-12 md:col-6">
            <label class="block font-medium mb-2" for="password-old">{{ t('password.oldPassword') }}</label>
            <Password
              id="password-old"
              v-model="passwordForm.oldPassword"
              class="w-full"
              input-class="w-full"
              toggle-mask
              :feedback="false"
            />
          </div>

          <div class="col-12 md:col-6">
            <label class="block font-medium mb-2" for="password-new">{{ t('password.newPassword') }}</label>
            <Password
              id="password-new"
              v-model="passwordForm.newPassword"
              class="w-full"
              input-class="w-full"
              toggle-mask
            />
          </div>
        </div>
      </div>

      <div class="flex justify-content-end">
        <Button :label="t('password.submit')" :loading="passwordLoading" @click="submitPassword" />
      </div>
    </div>

    <!-- Linked Accounts -->
    <div class="security-block">
      <div class="security-block-header">
        <h4 class="security-block-title">{{ t('security.linkedAccountsTitle') }}</h4>
        <p class="security-block-description">{{ t('security.linkedAccountsDescription') }}</p>
      </div>

      <div v-if="loadingLinkedAccounts" class="linked-accounts-loading">
        <i class="pi pi-spin pi-spinner" />
      </div>

      <div v-else class="linked-accounts-list">
        <div
          v-for="provider in providerList"
          :key="provider.type"
          class="linked-account-card"
        >
          <div class="linked-account-info">
            <span class="linked-account-icon">
              <i :class="provider.icon" />
            </span>
            <div class="linked-account-copy">
              <strong>{{ provider.label }}</strong>
              <span v-if="provider.linked" class="linked-badge linked-badge-active">
                {{ t('security.linked') }}
                <template v-if="provider.display"> · {{ provider.display }}</template>
              </span>
              <span v-else class="linked-badge linked-badge-inactive">
                {{ t('security.notLinked') }}
              </span>
            </div>
          </div>

          <div class="linked-account-action">
            <Button
              v-if="!provider.linked && provider.type !== 'PASSWORD'"
              :label="t('security.bind')"
              size="small"
              outlined
              @click="handleBind(provider.type)"
            />
            <Button
              v-if="provider.linked && provider.type !== 'PASSWORD'"
              :label="t('security.unbind')"
              size="small"
              severity="danger"
              text
              @click="$emit('unbind', provider.type)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Password from 'primevue/password';

const props = defineProps({
  linkedAccounts: {
    type: Array,
    default: () => [],
  },
  loadingLinkedAccounts: {
    type: Boolean,
    default: false,
  },
  passwordLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit-password', 'unbind']);
const { t } = useI18n();

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
});

const providerList = computed(() => {
  const linked = props.linkedAccounts || [];
  const map = {};
  for (const acc of linked) {
    map[acc.identityType] = acc;
  }

  return [
    {
      type: 'PASSWORD',
      label: t('security.passwordAuth'),
      icon: 'pi pi-lock',
      linked: !!map.PASSWORD,
      display: map.PASSWORD?.displayIdentifier || '',
    },
    {
      type: 'GITHUB',
      label: 'GitHub',
      icon: 'pi pi-github',
      linked: !!map.GITHUB,
      display: map.GITHUB?.displayIdentifier || '',
    },
    {
      type: 'GOOGLE',
      label: 'Google',
      icon: 'pi pi-google',
      linked: !!map.GOOGLE,
      display: map.GOOGLE?.displayIdentifier || '',
    },
  ];
});

function submitPassword() {
  emit('submit-password', {
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword,
  });

  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
}

function handleBind(providerType) {
  const provider = providerType.toLowerCase();

  if (provider === 'github') {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/bind-callback/github`;
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  } else if (provider === 'google') {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/bind-callback/google`;
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
  }
}
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.security-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.security-block-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.security-block-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.security-block-description {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
  line-height: 1.55;
}

.password-form-card {
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
}

.form-grid {
  margin: 0;
}

.linked-accounts-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
  color: var(--primary-color);
  font-size: 1.5rem;
}

.linked-accounts-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.linked-account-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  transition: border-color 180ms ease;
}

.linked-account-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 22%, var(--app-border));
}

.linked-account-info {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.linked-account-icon {
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.linked-account-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.linked-account-copy strong {
  font-size: 0.94rem;
  color: var(--text-color);
}

.linked-badge {
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.linked-badge-active {
  color: var(--green-500);
}

.linked-badge-inactive {
  color: var(--text-color-secondary);
}

.linked-account-action {
  flex-shrink: 0;
}
</style>
