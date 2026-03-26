<template>
  <div class="oauth-callback">
    <div class="oauth-callback-card">
      <i class="pi pi-spin pi-spinner oauth-spinner" />
      <p class="oauth-text">{{ t('security.binding') }}{{ providerLabel }}…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const userStore = useUserStore();

const provider = computed(() => route.params.provider);
const providerLabel = computed(() => {
  if (provider.value === 'github') return 'GitHub';
  if (provider.value === 'google') return 'Google';
  return provider.value;
});

onMounted(async () => {
  const code = route.query.code;
  if (!code || !provider.value) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('security.bindFailed'), life: 4000 });
    router.replace('/settings');
    return;
  }

  const redirectUri = `${window.location.origin}/auth/bind-callback/${provider.value}`;

  try {
    await userStore.bindOAuth(provider.value, code, redirectUri);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('security.bindSuccess'),
      life: 3000,
    });
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || t('security.bindFailed');
    toast.add({ severity: 'error', summary: t('common.error'), detail: message, life: 4000 });
  }

  router.replace('/settings?section=security');
});
</script>

<style scoped>
.oauth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--app-bg);
}

.oauth-callback-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 3rem;
}

.oauth-spinner {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.oauth-text {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}
</style>
