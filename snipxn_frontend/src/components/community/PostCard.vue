<template>
  <div
    class="post-card"
    :style="transitionStyle"
    role="button"
    tabindex="0"
    @click="emit('click', post.id)"
    @keydown.enter.prevent="emit('click', post.id)"
    @keydown.space.prevent="emit('click', post.id)"
  >
    <div class="post-card-top">
      <div class="post-card-author-shell post-card-author-link" @click.stop="showUserCard($event)">
        <Avatar
          :image="post.authorAvatar"
          :label="authorInitial"
          shape="circle"
        />
        <div class="post-card-author-copy">
          <span class="post-card-author">{{ post.authorNickname || t('common.unknown') }}</span>
          <span class="post-card-time">{{ relativeTime }}</span>
        </div>
      </div>

      <span class="post-card-arrow" aria-hidden="true">
        <i class="pi pi-angle-right" />
      </span>
    </div>

    <div class="post-card-body">
      <h3 class="post-card-title">{{ post.title || t('community.noPosts') }}</h3>

      <div v-if="codePreview" class="post-card-code-shell">
        <span class="post-card-code-language">{{ codeLanguage }}</span>
        <pre class="post-card-code"><code>{{ codePreview }}</code></pre>
      </div>

      <p v-if="textExcerpt" class="post-card-excerpt" :class="{ 'post-card-excerpt-secondary': codePreview }">
        {{ textExcerpt }}
      </p>
    </div>

    <div v-if="post.language || visibleTags.length || post.originNoteId" class="post-card-tags">
      <span v-if="post.language" class="post-card-chip post-card-chip-language">{{ post.language }}</span>
      <span v-for="tag in visibleTags" :key="tag" class="post-card-chip">#{{ tag }}</span>
      <span v-if="post.originNoteId" class="post-card-chip">#{{ post.originNoteId }}</span>
    </div>

    <UserHoverCard ref="userHoverCardRef" />

    <div class="post-card-stats">
      <span class="post-card-stat"><i class="pi pi-heart" /> {{ post.likeCount || 0 }}</span>
      <span class="post-card-stat"><i class="pi pi-bookmark" /> {{ post.collectCount || 0 }}</span>
      <span class="post-card-stat"><i class="pi pi-eye" /> {{ post.viewCount || 0 }}</span>
      <span class="post-card-stat"><i class="pi pi-share-alt" /> {{ post.shareCount || 0 }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Avatar from 'primevue/avatar';
import { useI18n } from 'vue-i18n';
import { getAvatarLabel } from '../../utils/avatar';
import UserHoverCard from './UserHoverCard.vue';

const userHoverCardRef = ref(null);

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  transitionName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['click']);
const { locale, t } = useI18n();

const authorInitial = computed(() => getAvatarLabel(props.post.authorNickname || '?'));
const visibleTags = computed(() => (props.post.tags || []).filter(Boolean).slice(0, 4));
const contentWithoutMarkdown = computed(() => normalizeContent(props.post.content));
const codeMatch = computed(() => String(props.post.content || '').match(/```([\w+-]*)\s*\n?([\s\S]*?)```/));
const codePreview = computed(() => {
  const snippet = String(codeMatch.value?.[2] || '').trim();

  if (!snippet) {
    return '';
  }

  return snippet
    .split('\n')
    .slice(0, 8)
    .join('\n')
    .slice(0, 320);
});
const codeLanguage = computed(() => props.post.language || codeMatch.value?.[1] || 'Code');
const textExcerpt = computed(() => {
  if (!contentWithoutMarkdown.value) {
    return codePreview.value ? '' : t('community.excerptFallback');
  }

  const maxLength = codePreview.value ? 150 : 220;
  return contentWithoutMarkdown.value.length > maxLength
    ? `${contentWithoutMarkdown.value.slice(0, maxLength).trim()}...`
    : contentWithoutMarkdown.value;
});
const relativeTime = computed(() => formatRelativeTime(props.post.createdAt, locale.value));
const transitionStyle = computed(() => (
  props.transitionName ? { viewTransitionName: props.transitionName } : null
));

function showUserCard(event) {
  if (props.post.userId) {
    userHoverCardRef.value?.show(event, props.post.userId);
  }
}

function normalizeContent(content = '') {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/[#>*`_\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatRelativeTime(value, currentLocale) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(currentLocale === 'zh' ? 'zh-CN' : 'en-US', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  }

  return new Intl.DateTimeFormat(currentLocale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
</script>

<style scoped>
.post-card,
.post-card-top,
.post-card-author-shell,
.post-card-author-copy,
.post-card-body,
.post-card-tags,
.post-card-stats {
  display: flex;
}

.post-card {
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.3rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-raised) 99%, transparent);
  box-shadow: var(--app-shadow-soft);
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.post-card:hover,
.post-card:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
  box-shadow: 0 24px 42px -34px color-mix(in srgb, var(--primary-color) 28%, #020617);
}

.post-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary-color) 36%, transparent);
  outline-offset: 2px;
}

.post-card-top {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.post-card-author-shell {
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.post-card-author-copy,
.post-card-body {
  min-width: 0;
  flex-direction: column;
}

.post-card-author-copy {
  gap: 0.12rem;
}

.post-card-author-link {
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.15rem 0.3rem;
  margin: -0.15rem -0.3rem;
  transition: background 160ms ease;
}

.post-card-author-link:hover {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.post-card-author-link:hover .post-card-author {
  color: var(--primary-color);
}

.post-card-author {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-color);
  transition: color 160ms ease;
}

.post-card-time,
.post-card-arrow,
.post-card-excerpt,
.post-card-stat {
  color: var(--text-color-secondary);
}

.post-card-time {
  font-size: 0.78rem;
}

.post-card-arrow {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.post-card-body {
  gap: 0.85rem;
}

.post-card-title {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: var(--text-color);
}

.post-card-excerpt {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.75;
}

.post-card-excerpt-secondary {
  margin-top: -0.15rem;
}

.post-card-code-shell {
  position: relative;
  padding: 1rem 1rem 0.95rem;
  border: 1px solid var(--app-code-border);
  border-radius: 0.95rem;
  background: var(--app-code-bg);
  box-shadow: inset 0 1px 0 color-mix(in srgb, white 5%, transparent);
  overflow: hidden;
}

.post-card-code-language {
  position: absolute;
  top: 0.75rem;
  right: 0.85rem;
  color: var(--app-code-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.post-card-code {
  margin: 0;
  padding: 0;
  color: var(--app-code-text);
  font-size: 0.84rem;
  line-height: 1.65;
  font-family: var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}

.post-card-tags {
  flex-wrap: wrap;
  gap: 0.45rem;
}

.post-card-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.34rem 0.68rem;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.post-card-chip-language {
  border-color: color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--primary-color);
}

.post-card-stats {
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.95rem;
  border-top: 1px solid var(--app-border);
}

.post-card-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
}

.post-card :deep(.p-avatar) {
  width: 2.5rem;
  height: 2.5rem;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-subtle));
  color: var(--primary-color);
  border: 1px solid color-mix(in srgb, var(--primary-color) 10%, var(--app-border));
}

@media (max-width: 640px) {
  .post-card {
    padding: 1.05rem;
  }

  .post-card-top {
    align-items: flex-start;
  }

  .post-card-stats {
    gap: 0.75rem;
  }
}
</style>
