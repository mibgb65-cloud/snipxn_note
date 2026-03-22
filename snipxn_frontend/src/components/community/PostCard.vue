<template>
  <div
    class="post-card"
    role="button"
    tabindex="0"
    @click="emit('click', post.id)"
    @keydown.enter="emit('click', post.id)"
    @keydown.space.prevent="emit('click', post.id)"
  >
    <div class="post-card-main">
      <div class="post-card-top">
        <div class="post-card-author-shell">
          <Avatar
            :image="post.authorAvatar"
            :label="(post.authorNickname || '?')[0]"
            shape="circle"
            size="small"
          />
          <div class="post-card-author-copy">
            <span class="post-card-author">{{ post.authorNickname || t('common.unknown') }}</span>
            <span class="post-card-time">{{ formatTime(post.createdAt) }}</span>
          </div>
        </div>

        <div class="post-card-stats">
          <span><i class="pi pi-eye" /> {{ post.viewCount || 0 }}</span>
          <span><i class="pi pi-heart" /> {{ post.likeCount || 0 }}</span>
          <span><i class="pi pi-bookmark" /> {{ post.collectCount || 0 }}</span>
        </div>
      </div>

      <h3 class="post-card-title">{{ post.title }}</h3>
      <p class="post-card-excerpt">{{ excerpt }}</p>

      <div class="post-card-footer">
        <div v-if="post.tags?.length || post.language" class="post-card-tags">
          <Tag v-if="post.language" :value="post.language" severity="info" />
          <Tag v-for="tag in (post.tags || [])" :key="tag" :value="tag" severity="secondary" />
        </div>

        <span v-if="post.originNoteId" class="post-card-origin">#{{ post.originNoteId }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click']);
const { locale, t } = useI18n();

const excerpt = computed(() => {
  const rawContent = String(props.post.content || '').replace(/\s+/g, ' ').trim();

  if (!rawContent) {
    return t('community.excerptFallback');
  }

  return rawContent.length > 140 ? `${rawContent.slice(0, 140)}...` : rawContent;
});

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
</script>

<style scoped>
.post-card {
  padding: 1rem 1.05rem;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.post-card:hover,
.post-card:focus-visible {
  background: color-mix(in srgb, var(--primary-color) 5%, var(--app-panel-subtle));
}

.post-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary-color) 36%, transparent);
  outline-offset: -2px;
}

.post-card-main,
.post-card-top,
.post-card-author-shell,
.post-card-author-copy,
.post-card-stats,
.post-card-footer,
.post-card-tags {
  display: flex;
}

.post-card-main {
  flex-direction: column;
  gap: 0.55rem;
}

.post-card-top,
.post-card-footer {
  justify-content: space-between;
  gap: 0.85rem;
  align-items: flex-start;
}

.post-card-author-shell {
  gap: 0.7rem;
  min-width: 0;
}

.post-card-author-copy {
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.post-card-author {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-color);
}

.post-card-time,
.post-card-origin,
.post-card-stats {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.post-card-time,
.post-card-origin {
  font-family: var(--font-mono);
}

.post-card-title {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.4;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.post-card-excerpt {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.post-card-tags {
  flex-wrap: wrap;
  gap: 0.4rem;
}

.post-card-stats {
  gap: 0.75rem;
  flex-wrap: wrap;
}

.post-card-stats span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.post-card :deep(.p-avatar) {
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-subtle));
  color: var(--primary-color);
}

.post-card :deep(.p-tag) {
  border: 1px solid var(--app-border);
}

@media (max-width: 640px) {
  .post-card-top,
  .post-card-footer {
    flex-direction: column;
  }
}
</style>
