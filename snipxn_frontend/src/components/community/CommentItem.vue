<template>
  <div class="comment-item" :class="{ 'comment-item-reply': isReply }">
    <div class="comment-item-header">
      <div class="comment-item-author-link" @click="showUserCard($event)">
        <Avatar
          v-if="comment.authorAvatar"
          :image="comment.authorAvatar"
          shape="circle"
          :size="isReply ? 'normal' : 'large'"
          class="comment-item-avatar"
        />
        <Avatar
          v-else
          :label="authorInitial"
          shape="circle"
          :size="isReply ? 'normal' : 'large'"
          class="comment-item-avatar"
        />
      </div>

      <div class="comment-item-author">
        <div class="comment-item-name-row">
          <strong class="comment-item-name comment-item-name-link" @click="showUserCard($event)">{{ comment.authorNickname || t('common.unknown') }}</strong>
          <template v-if="comment.replyToNickname">
            <i class="pi pi-angle-right comment-reply-arrow" />
            <span class="comment-reply-to">{{ comment.replyToNickname }}</span>
          </template>
        </div>
        <span class="comment-item-time">{{ formattedTime }}</span>
      </div>
    </div>

    <div class="comment-item-body">{{ comment.content }}</div>

    <div class="comment-item-actions">
      <button
        type="button"
        class="comment-action-btn"
        :class="{ 'comment-action-active': comment.liked }"
        @click="$emit('toggle-like', comment)"
      >
        <i :class="comment.liked ? 'pi pi-heart-fill' : 'pi pi-heart'" />
        <span>{{ comment.likeCount || 0 }}</span>
      </button>

      <button
        type="button"
        class="comment-action-btn"
        @click="$emit('reply', comment)"
      >
        <i class="pi pi-reply" />
        <span>{{ t('comment.reply') }}</span>
      </button>

      <button
        v-if="isOwner"
        type="button"
        class="comment-action-btn comment-action-delete"
        @click="$emit('delete', comment)"
      >
        <i class="pi pi-trash" />
      </button>

      <button
        v-if="!isReply && (comment.replyCount > 0 || showReplies)"
        type="button"
        class="comment-action-btn"
        @click="$emit('toggle-replies', comment)"
      >
        <i :class="showReplies ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
        <span>{{ comment.replyCount || 0 }} {{ t('comment.replies') }}</span>
      </button>
    </div>

    <form
      v-if="isLoggedIn && isActiveReplyTarget"
      class="comment-inline-compose"
      @submit.prevent="$emit('submit-reply', comment)"
    >
      <Textarea
        :model-value="replyContent"
        :placeholder="t('comment.replyTo', { name: comment.authorNickname || t('common.unknown') })"
        rows="3"
        auto-resize
        class="comment-inline-compose-input"
        @update:model-value="$emit('update-reply-content', $event)"
      />

      <div class="comment-inline-compose-actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          text
          size="small"
          @click="$emit('cancel-reply')"
        />
        <Button
          type="submit"
          :label="t('comment.replyAction')"
          icon="pi pi-send"
          size="small"
          :disabled="!replyContent.trim()"
          :loading="replySubmitting"
        />
      </div>
    </form>

    <div v-if="showReplies && replies.length" class="comment-replies">
      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :current-user-id="currentUserId"
        :is-reply="true"
        :is-logged-in="isLoggedIn"
        :active-reply-id="activeReplyId"
        :reply-content="replyContent"
        :reply-submitting="replySubmitting"
        @toggle-like="$emit('toggle-like', $event)"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
        @update-reply-content="$emit('update-reply-content', $event)"
        @cancel-reply="$emit('cancel-reply')"
        @submit-reply="$emit('submit-reply', $event)"
      />
      <button
        v-if="hasMoreReplies"
        type="button"
        class="comment-load-more"
        @click="$emit('load-more-replies', comment)"
      >
        {{ t('comment.loadMoreReplies') }}
      </button>
    </div>

    <UserHoverCard ref="userHoverCardRef" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import { getAvatarLabel } from '../../utils/avatar';
import UserHoverCard from './UserHoverCard.vue';

const userHoverCardRef = ref(null);

const { t, locale } = useI18n();

const props = defineProps({
  comment: { type: Object, required: true },
  currentUserId: { type: String, default: null },
  isReply: { type: Boolean, default: false },
  showReplies: { type: Boolean, default: false },
  replies: { type: Array, default: () => [] },
  hasMoreReplies: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  activeReplyId: { type: [String, Number], default: undefined },
  replyContent: { type: String, default: '' },
  replySubmitting: { type: Boolean, default: false },
});

defineEmits([
  'toggle-like',
  'reply',
  'delete',
  'toggle-replies',
  'load-more-replies',
  'update-reply-content',
  'cancel-reply',
  'submit-reply',
]);

const authorInitial = computed(() => getAvatarLabel(props.comment.authorNickname || '?'));
const isOwner = computed(() => props.currentUserId && props.currentUserId === props.comment.userId);
const isActiveReplyTarget = computed(() => {
  if (props.activeReplyId == null || props.comment.id == null) {
    return false;
  }

  return String(props.activeReplyId) === String(props.comment.id);
});

const formattedTime = computed(() => {
  if (!props.comment.createdAt) return '';
  const date = new Date(props.comment.createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('comment.justNow');
  if (diffMin < 60) return `${diffMin}${t('comment.minutesAgo')}`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}${t('comment.hoursAgo')}`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}${t('comment.daysAgo')}`;

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short', day: 'numeric',
  }).format(date);
});

function showUserCard(event) {
  if (props.comment.userId) {
    userHoverCardRef.value?.show(event, props.comment.userId);
  }
}
</script>

<style scoped>
.comment-item {
  padding: 0.95rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 56%, transparent);
}

.comment-item-reply {
  padding: 0.7rem 0 0.55rem;
  margin-left: 1.05rem;
  border-bottom: none;
}

.comment-item-reply + .comment-item-reply {
  border-top: 1px solid color-mix(in srgb, var(--app-border) 38%, transparent);
}

.comment-item-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.comment-item-author-link {
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
  transition: opacity 160ms ease;
}

.comment-item-author-link:hover {
  opacity: 0.8;
}

.comment-item-name-link {
  cursor: pointer;
  transition: color 160ms ease;
}

.comment-item-name-link:hover {
  color: var(--primary-color) !important;
}

.comment-item-avatar {
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--app-border) 88%, transparent);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  box-shadow: 0 10px 18px -18px color-mix(in srgb, var(--primary-color) 36%, transparent);
}

.comment-item-avatar :deep(img) {
  object-fit: cover;
}

.comment-item-author {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.18rem;
}

.comment-item-name-row {
  display: flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
  flex-wrap: wrap;
}

.comment-item-name {
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: color-mix(in srgb, var(--text-color) 96%, transparent);
  line-height: 1.25;
}

.comment-reply-arrow {
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--text-color-secondary) 84%, transparent);
  flex-shrink: 0;
}

.comment-reply-to {
  font-size: 0.82rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--primary-color) 86%, var(--text-color));
  line-height: 1.3;
}

.comment-item-time {
  font-size: 0.74rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--text-color-secondary) 86%, transparent);
  letter-spacing: 0.01em;
}

.comment-item-body {
  margin: 0.58rem 0 0.48rem;
  padding-left: 3.25rem;
  font-size: 0.96rem;
  line-height: 1.72;
  color: color-mix(in srgb, var(--text-color) 94%, var(--text-color-secondary));
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-item-reply .comment-item-body {
  padding-left: 2.55rem;
  font-size: 0.92rem;
  line-height: 1.68;
}

.comment-item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding-left: 3.25rem;
}

.comment-item-reply .comment-item-actions {
  padding-left: 2.55rem;
}

.comment-inline-compose {
  margin-top: 0.75rem;
  padding: 0.8rem 0 0 3.25rem;
  border-top: 1px dashed color-mix(in srgb, var(--app-border) 76%, transparent);
}

.comment-item-reply .comment-inline-compose {
  padding-left: 2.55rem;
}

.comment-inline-compose-input {
  width: 100%;
  min-height: 4rem;
  border-color: var(--app-border-strong) !important;
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent) !important;
  color: var(--text-color) !important;
  box-shadow: none !important;
}

.comment-inline-compose-input::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 78%, transparent) !important;
  opacity: 1;
}

.comment-inline-compose-input:enabled:hover {
  border-color: color-mix(in srgb, var(--primary-color) 36%, var(--app-border-strong)) !important;
}

.comment-inline-compose-input:enabled:focus {
  border-color: color-mix(in srgb, var(--primary-color) 58%, var(--app-border-strong)) !important;
  background: color-mix(in srgb, var(--app-panel-raised) 88%, var(--app-panel-inset)) !important;
  box-shadow: 0 0 0 3px var(--app-focus-ring) !important;
}

.comment-inline-compose-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.comment-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.9rem;
  padding: 0.28rem 0.62rem;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--app-panel-subtle) 55%, transparent);
  color: color-mix(in srgb, var(--text-color-secondary) 92%, transparent);
  font-size: 0.77rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 999px;
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.comment-action-btn i {
  font-size: 0.82rem;
}

.comment-action-btn span {
  line-height: 1;
}

.comment-action-btn:hover {
  border-color: color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-raised));
  color: var(--primary-color);
  transform: translateY(-1px);
}

.comment-action-btn:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  box-shadow: 0 0 0 0.18rem color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.comment-action-active {
  color: var(--red-500, #ef4444);
  border-color: color-mix(in srgb, var(--red-500, #ef4444) 18%, var(--app-border));
  background: color-mix(in srgb, var(--red-500, #ef4444) 9%, var(--app-panel-raised));
}

.comment-action-active:hover {
  color: var(--red-500, #ef4444);
  border-color: color-mix(in srgb, var(--red-500, #ef4444) 26%, var(--app-border));
  background: color-mix(in srgb, var(--red-500, #ef4444) 13%, var(--app-panel-raised));
}

.comment-action-delete:hover {
  color: var(--red-500, #ef4444);
  border-color: color-mix(in srgb, var(--red-500, #ef4444) 22%, var(--app-border));
  background: color-mix(in srgb, var(--red-500, #ef4444) 9%, var(--app-panel-raised));
}

.comment-replies {
  margin: 0.85rem 0 0 1.55rem;
  padding: 0.25rem 0 0 1rem;
  border-left: 2px solid color-mix(in srgb, var(--app-border) 70%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 3%, transparent), transparent 78%);
}

.comment-load-more {
  display: block;
  width: 100%;
  padding: 0.55rem 0.4rem 0.2rem;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--primary-color) 88%, var(--text-color));
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.comment-load-more:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .comment-item-body,
  .comment-item-actions,
  .comment-inline-compose {
    padding-left: 2.95rem;
  }

  .comment-item-reply .comment-item-body,
  .comment-item-reply .comment-item-actions,
  .comment-item-reply .comment-inline-compose {
    padding-left: 2.3rem;
  }
}
</style>
