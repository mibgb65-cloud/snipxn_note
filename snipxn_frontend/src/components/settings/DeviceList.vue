<template>
  <section class="settings-section">
    <div class="flex justify-content-end">
      <Button
        icon="pi pi-shield"
        severity="secondary"
        outlined
        :label="t('devices.revokeOthers')"
        @click="$emit('revoke-others')"
      />
    </div>

    <div v-if="loading" class="device-loading">
      <Skeleton v-for="index in 3" :key="index" height="6rem" border-radius="1rem" />
    </div>

    <div v-else-if="devices.length" class="device-list">
      <article v-for="device in devices" :key="device.deviceId" class="device-card">
        <div class="flex justify-content-between gap-3">
          <div>
            <div class="flex align-items-center gap-2 flex-wrap">
              <h4 class="m-0">{{ device.deviceName || t('common.unknown') }}</h4>
              <Tag v-if="device.deviceId === currentDeviceId" severity="success" :value="t('devices.currentDevice')" />
            </div>

            <div class="device-meta">{{ t('devices.deviceId') }}: {{ device.deviceId }}</div>
            <div class="device-meta">{{ t('devices.lastLoginIp') }}: {{ device.lastLoginIp || '-' }}</div>
            <div class="device-meta">{{ t('devices.lastLoginAt') }}: {{ formatTime(device.lastLoginAt) }}</div>
          </div>

          <Button
            v-if="device.deviceId !== currentDeviceId"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :aria-label="t('devices.revoke')"
            @click="$emit('revoke', device.deviceId)"
          />
        </div>
      </article>
    </div>

    <p v-else class="device-empty m-0">{{ t('devices.noDevices') }}</p>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';

defineProps({
  devices: {
    type: Array,
    default: () => [],
  },
  currentDeviceId: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['revoke', 'revoke-others']);

const { locale, t } = useI18n();

function formatTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
</script>

<style scoped>
.settings-section,
.device-loading,
.device-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.device-card {
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
  transition: transform 180ms ease, border-color 180ms ease;
}

.device-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--surface-border));
}

.device-meta,
.device-empty {
  margin-top: 0.4rem;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.device-empty {
  padding: 1.5rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 22%, var(--surface-border));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface-ground) 22%, transparent);
}
</style>
