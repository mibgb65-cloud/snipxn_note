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
    </div>

    <div class="post-card-body">
      <h3 class="post-card-title">{{ post.title || t('community.noPosts') }}</h3>

      <p v-if="textExcerpt" class="post-card-excerpt" :class="{ 'post-card-excerpt-secondary': codePreview }">
        {{ textExcerpt }}
      </p>

      <div v-if="codePreview" class="post-card-code-shell">
        <span class="post-card-code-language">{{ codeLanguage }}</span>
        <pre class="post-card-code"><code>{{ codePreview }}</code></pre>
      </div>
    </div>

    <div v-if="post.language || visibleTags.length || post.originNoteId" class="post-card-tags">
      <span v-if="post.language" class="post-card-chip post-card-chip-language">{{ post.language }}</span>
      <span v-for="tag in visibleTags" :key="tag" class="post-card-chip">#{{ tag }}</span>
      <span v-if="post.originNoteId" class="post-card-chip">#{{ post.originNoteId }}</span>
    </div>

    <UserHoverCard ref="userHoverCardRef" />

    <div class="post-card-stats">
      <span class="post-card-stat">
        <i class="pi pi-heart" />
        <span class="post-card-stat-copy">
          <span class="post-card-stat-value">{{ post.likeCount || 0 }}</span>
          <span class="post-card-stat-label">{{ t('community.likes') }}</span>
        </span>
      </span>
      <span class="post-card-stat">
        <i class="pi pi-bookmark" />
        <span class="post-card-stat-copy">
          <span class="post-card-stat-value">{{ post.collectCount || 0 }}</span>
          <span class="post-card-stat-label">{{ t('community.collects') }}</span>
        </span>
      </span>
      <span class="post-card-stat">
        <i class="pi pi-eye" />
        <span class="post-card-stat-copy">
          <span class="post-card-stat-value">{{ post.viewCount || 0 }}</span>
          <span class="post-card-stat-label">{{ t('community.views') }}</span>
        </span>
      </span>
      <span class="post-card-stat">
        <i class="pi pi-share-alt" />
        <span class="post-card-stat-copy">
          <span class="post-card-stat-value">{{ post.shareCount || 0 }}</span>
          <span class="post-card-stat-label">{{ t('community.share') }}</span>
        </span>
      </span>
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
  --post-card-ink-strong: var(--community-ink-strong, var(--text-color));
  --post-card-ink-title: var(--community-ink-title, var(--text-color));
  --post-card-ink-body: var(--community-ink-body, color-mix(in srgb, var(--text-color-secondary) 82%, var(--text-color) 18%));
  --post-card-ink-soft: var(--community-ink-soft, color-mix(in srgb, var(--text-color-secondary) 88%, var(--text-color) 12%));
  --post-card-ink-faint: var(--community-ink-faint, color-mix(in srgb, var(--text-color-secondary) 92%, transparent));
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
  justify-content: flex-start;
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
  gap: 0.18rem;
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
  font-size: 0.88rem;
  font-weight: 720;
  color: var(--post-card-ink-strong);
  line-height: 1.15;
  letter-spacing: -0.01em;
  transition: color 160ms ease;
}

.post-card-time,
.post-card-excerpt {
  color: var(--post-card-ink-body);
}

.post-card-time {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--post-card-ink-faint);
}

.post-card-body {
  gap: 0.76rem;
}

.post-card-title {
  margin: 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.08rem, 1rem + 0.28vw, 1.22rem);
  font-weight: 780;
  line-height: 1.22;
  letter-spacing: -0.03em;
  color: var(--post-card-ink-title);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.post-card-excerpt {
  margin: 0;
  font-size: 0.91rem;
  line-height: 1.66;
  color: var(--post-card-ink-body);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.post-card-excerpt-secondary {
  -webkit-line-clamp: 3;
}

.post-card-code-shell {
  position: relative;
  padding: 0.95rem 0.95rem 0.9rem;
  border: 1px solid var(--app-code-border);
  border-radius: 0.95rem;
  background: var(--app-code-bg);
  box-shadow: inset 0 1px 0 color-mix(in srgb, white 5%, transparent);
  overflow: hidden;
}

.post-card-code-language {
  position: absolute;
  top: 0.72rem;
  right: 0.82rem;
  color: color-mix(in srgb, var(--app-code-muted) 82%, white 18%);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.post-card-code {
  margin: 0;
  padding: 0;
  color: var(--app-code-text);
  font-size: 0.8rem;
  line-height: 1.6;
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
  padding: 0.32rem 0.62rem;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  color: var(--post-card-ink-soft);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.post-card-chip-language {
  border-color: color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--primary-color);
}

.post-card-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  padding-top: 0.88rem;
  border-top: 1px solid var(--app-border);
}

.post-card-stat {
  min-width: 0;
  display: inline-flex;
  align-items: flex-start;
  gap: 0.48rem;
  padding: 0.56rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 94%, transparent);
  border-radius: 0.92rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.post-card-stat i {
  margin-top: 0.12rem;
  color: color-mix(in srgb, var(--primary-color) 72%, var(--post-card-ink-soft));
}

.post-card-stat-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

.post-card-stat-value {
  color: var(--post-card-ink-strong);
  font-size: 0.9rem;
  font-weight: 760;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.post-card-stat-label {
  color: var(--post-card-ink-faint);
  font-family: var(--font-mono);
  font-size: 0.61rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
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

  .post-card-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
