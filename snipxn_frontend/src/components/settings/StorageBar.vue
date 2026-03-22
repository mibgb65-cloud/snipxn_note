<template>
  <section class="settings-section storage-card">
    <div class="storage-header">
      <div>
        <h3 class="m-0">{{ t('storage.title') }}</h3>
        <p class="m-0 storage-caption">
          {{ description }}
        </p>
      </div>
      <div class="storage-percent">{{ percent }}%</div>
    </div>

    <Skeleton v-if="loading" height="2rem" border-radius="999px" />
    <ProgressBar v-else :value="percent" :show-value="false" />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  profile: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  percent: {
    type: Number,
    default: 0,
  },
});

const { t } = useI18n();

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = numericValue;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

const description = computed(() => {
  if (!props.profile?.storageLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(props.profile.storageUsed),
    limit: formatBytes(props.profile.storageLimit),
  });
});
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.storage-card {
  padding: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 9%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 96%, transparent));
}

.storage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.storage-caption {
  margin-top: 0.35rem;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.storage-percent {
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.04em;
}
</style>
