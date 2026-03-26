<template>
  <section class="storage-selector">
    <!-- A. Overview card -->
    <div class="storage-overview-card">
      <div class="storage-header">
        <div>
          <h3 class="m-0">{{ t('storage.title') }}</h3>
          <p class="m-0 storage-caption">{{ description }}</p>
        </div>
        <div class="storage-percent">{{ percent }}%</div>
      </div>

      <Skeleton v-if="loading" height="2rem" border-radius="999px" />
      <ProgressBar v-else :value="percent" :show-value="false" />
    </div>

    <!-- B. Category breakdown grid -->
    <div class="storage-grid">
      <div v-for="card in cards" :key="card.key" class="storage-card">
        <div class="storage-card-top">
          <i :class="card.icon" class="storage-card-icon" aria-hidden="true" />
          <span class="storage-card-label">{{ t(card.labelKey) }}</span>
        </div>
        <div class="storage-card-value">
          <Skeleton v-if="loading" width="5rem" height="1.6rem" />
          <span v-else>{{ formatBytes(card.bytes) }}</span>
        </div>
        <div v-if="card.countText" class="storage-card-count">
          <Skeleton v-if="loading" width="4rem" height="0.85rem" />
          <span v-else>{{ card.countText }}</span>
        </div>
      </div>
    </div>

    <!-- C. Hint card -->
    <div class="storage-hint-card">
      <i class="pi pi-info-circle storage-hint-icon" aria-hidden="true" />
      <p class="storage-hint-text">{{ t('storage.hint') }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  breakdown: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
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

const percent = computed(() => {
  const limit = Number(props.breakdown?.totalLimit || 0);
  const used = Number(props.breakdown?.totalUsed || 0);

  if (!limit) {
    return 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
});

const description = computed(() => {
  if (!props.breakdown?.totalLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(props.breakdown.totalUsed),
    limit: formatBytes(props.breakdown.totalLimit),
  });
});

const cards = computed(() => [
  {
    key: 'notes',
    icon: 'pi pi-file-edit',
    labelKey: 'storage.notes',
    bytes: props.breakdown?.noteBytes || 0,
    countText: props.breakdown
      ? t('storage.noteCountValue', { count: props.breakdown.noteCount })
      : '',
  },
  {
    key: 'images',
    icon: 'pi pi-image',
    labelKey: 'storage.images',
    bytes: props.breakdown?.imageBytes || 0,
    countText: props.breakdown
      ? t('storage.imageCountValue', { count: props.breakdown.imageCount })
      : '',
  },
  {
    key: 'deleted',
    icon: 'pi pi-trash',
    labelKey: 'storage.deleted',
    bytes: props.breakdown?.deletedBytes || 0,
    countText: null,
  },
]);
</script>

<style scoped>
.storage-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.storage-overview-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.storage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.storage-card {
  padding: 0.9rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.storage-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.storage-card-top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.storage-card-icon {
  font-size: 1rem;
  color: var(--primary-color);
}

.storage-card-label {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-color);
}

.storage-card-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.03em;
}

.storage-card-count {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.storage-hint-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
}

.storage-hint-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.storage-hint-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .storage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
