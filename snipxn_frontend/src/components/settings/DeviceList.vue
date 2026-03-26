<template>
  <section class="device-selector">
    <!-- A. Skeleton loading -->
    <div v-if="loading" class="device-grid">
      <div v-for="index in 3" :key="index" class="device-card">
        <div class="device-card-top">
          <Skeleton width="1.4rem" height="1.4rem" shape="circle" />
          <Skeleton width="6rem" height="1rem" />
        </div>
        <Skeleton width="8rem" height="0.85rem" />
        <Skeleton width="7rem" height="0.85rem" />
      </div>
    </div>

    <!-- B. Device grid -->
    <div v-else-if="devices.length" class="device-grid">
      <article
        v-for="device in devices"
        :key="device.deviceId"
        class="device-card"
        :class="{ 'device-card-active': device.deviceId === currentDeviceId }"
      >
        <div class="device-card-top">
          <i :class="deviceIcon(device.deviceName)" class="device-card-icon" aria-hidden="true" />
          <span class="device-card-name">{{ device.deviceName || t('common.unknown') }}</span>
          <Tag
            v-if="device.deviceId === currentDeviceId"
            severity="success"
            :value="t('devices.currentDevice')"
            class="device-card-tag"
          />
        </div>

        <div class="device-card-meta">
          <span>{{ device.lastLoginIp || '-' }}</span>
          <span class="device-card-dot">·</span>
          <span>{{ formatTime(device.lastLoginAt) }}</span>
        </div>

        <div v-if="device.deviceId !== currentDeviceId" class="device-card-actions">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            :aria-label="t('devices.revoke')"
            @click="$emit('revoke', device.deviceId)"
          />
        </div>
      </article>
    </div>

    <!-- C. Empty state -->
    <div v-else class="device-empty-state">
      <i class="pi pi-desktop device-empty-icon" aria-hidden="true" />
      <p class="device-empty-text">{{ t('devices.noDevices') }}</p>
    </div>

    <!-- D. Hint card -->
    <div class="device-hint-card">
      <div class="device-hint-left">
        <i class="pi pi-shield device-hint-icon" aria-hidden="true" />
        <p class="device-hint-text">{{ t('devices.hint') }}</p>
      </div>
      <Button
        :label="t('devices.revokeOthers')"
        severity="secondary"
        outlined
        size="small"
        @click="$emit('revoke-others')"
      />
    </div>
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

const MOBILE_PATTERN = /mobile|iphone|android|phone/i;

function deviceIcon(name) {
  return MOBILE_PATTERN.test(name || '') ? 'pi pi-mobile' : 'pi pi-desktop';
}

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
.device-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.75rem;
}

.device-card {
  position: relative;
  padding: 0.9rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.device-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.device-card-active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
}

.device-card-top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.device-card-icon {
  font-size: 1.1rem;
  color: var(--primary-color);
}

.device-card-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-color);
}

.device-card-tag {
  margin-left: auto;
}

.device-card-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.device-card-dot {
  opacity: 0.5;
}

.device-card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

/* Empty state */
.device-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 22%, var(--app-border));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-inset) 40%, transparent);
}

.device-empty-icon {
  font-size: 1.6rem;
  color: var(--text-color-secondary);
  opacity: 0.6;
}

.device-empty-text {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-color-secondary);
}

/* Hint card */
.device-hint-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
}

.device-hint-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.device-hint-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.device-hint-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .device-grid {
    grid-template-columns: 1fr;
  }

  .device-hint-card {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
}
</style>
