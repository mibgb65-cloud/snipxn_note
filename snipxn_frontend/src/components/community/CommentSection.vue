<template>
  <section class="comment-section">
    <div class="comment-section-header">
      <h3 class="comment-section-title">
        {{ t('comment.title') }}
        <span class="comment-section-count">({{ totalComments }})</span>
      </h3>
    </div>

    <form v-if="isLoggedIn" class="comment-compose" @submit.prevent="handleTopLevelSubmit">
      <Textarea
        v-model="newCommentContent"
        :placeholder="t('comment.placeholder')"
        rows="3"
        auto-resize
        class="comment-compose-input"
      />

      <div class="comment-compose-actions">
        <Button
          type="submit"
          :label="t('comment.submit')"
          icon="pi pi-send"
          size="small"
          :disabled="!newCommentContent.trim()"
          :loading="topLevelSubmitting"
        />
      </div>
    </form>

    <div v-if="communityStore.loadingComments" class="comment-loading">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="communityStore.comments.length" class="comment-list">
      <CommentItem
        v-for="comment in communityStore.comments"
        :key="comment.id"
        :comment="comment"
        :current-user-id="currentUserId"
        :show-replies="expandedReplies.has(comment.id)"
        :replies="repliesMap[comment.id] || []"
        :has-more-replies="hasMoreRepliesMap[comment.id] || false"
        :is-logged-in="isLoggedIn"
        :active-reply-id="activeReplyId"
        :reply-content="replyContent"
        :reply-submitting="replySubmitting"
        @toggle-like="handleToggleLike"
        @reply="handleReply"
        @delete="handleDelete"
        @toggle-replies="handleToggleReplies"
        @load-more-replies="handleLoadMoreReplies"
        @update-reply-content="handleReplyContentChange"
        @cancel-reply="cancelReply"
        @submit-reply="handleReplySubmit"
      />

      <Paginator
        v-if="communityStore.commentTotal > 20"
        class="comment-paginator"
        :first="(communityStore.commentPage - 1) * 20"
        :rows="20"
        :total-records="communityStore.commentTotal"
        @page="handlePageChange"
      />
    </div>

    <div v-else class="comment-empty">
      <i class="pi pi-comments" />
      <p>{{ t('comment.empty') }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import Textarea from 'primevue/textarea';
import CommentItem from './CommentItem.vue';
import { useCommunityStore } from '../../stores/community';
import { useAuthStore } from '../../stores/auth';

const { t } = useI18n();
const toast = useToast();
const communityStore = useCommunityStore();
const authStore = useAuthStore();

const props = defineProps({
  postId: { type: String, required: true },
});

const newCommentContent = ref('');
const replyContent = ref('');
const replyTarget = ref(null);
const topLevelSubmitting = ref(false);
const replySubmitting = ref(false);
const expandedReplies = reactive(new Set());
const repliesMap = reactive({});
const repliesPageMap = reactive({});
const hasMoreRepliesMap = reactive({});

const isLoggedIn = computed(() => Boolean(authStore.user));
const currentUserId = computed(() => authStore.user?.id || null);
const totalComments = computed(() => communityStore.commentTotal);
const activeReplyId = computed(() => replyTarget.value?.id);

watch(() => props.postId, (postId) => {
  if (postId) {
    communityStore.fetchComments(postId, { page: 1 });
    newCommentContent.value = '';
    cancelReply();
    expandedReplies.clear();
    Object.keys(repliesMap).forEach((key) => delete repliesMap[key]);
    Object.keys(repliesPageMap).forEach((key) => delete repliesPageMap[key]);
    Object.keys(hasMoreRepliesMap).forEach((key) => delete hasMoreRepliesMap[key]);
  }
}, { immediate: true });

function cancelReply() {
  replyTarget.value = null;
  replyContent.value = '';
}

function handleReplyContentChange(value) {
  replyContent.value = value;
}

function updateReplyState(commentId, updater) {
  for (const replies of Object.values(repliesMap)) {
    const reply = replies.find((item) => String(item.id) === String(commentId));
    if (reply) {
      updater(reply);
      return true;
    }
  }

  return false;
}

async function handleTopLevelSubmit() {
  const content = newCommentContent.value.trim();
  if (!content) return;

  topLevelSubmitting.value = true;

  try {
    await communityStore.createComment(props.postId, { content });
    newCommentContent.value = '';
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('comment.submitSuccess'), life: 2200 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('comment.submitFailed'), life: 3000 });
  } finally {
    topLevelSubmitting.value = false;
  }
}

async function handleToggleLike(comment) {
  if (!isLoggedIn.value) return;

  const wasLiked = Boolean(comment.liked);

  try {
    if (wasLiked) {
      await communityStore.unlikeComment(props.postId, comment.id);
    } else {
      await communityStore.likeComment(props.postId, comment.id);
    }

    updateReplyState(comment.id, (reply) => {
      reply.liked = !wasLiked;
      reply.likeCount = wasLiked
        ? Math.max(0, (reply.likeCount || 0) - 1)
        : (reply.likeCount || 0) + 1;
    });
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('common.error'), life: 3000 });
  }
}

function handleReply(comment) {
  replyTarget.value = comment;
  replyContent.value = '';
}

async function handleReplySubmit(comment) {
  const target = comment || replyTarget.value;
  const content = replyContent.value.trim();

  if (!target || !content) return;

  replySubmitting.value = true;

  try {
    await communityStore.createComment(props.postId, {
      content,
      parentId: target.id,
    });

    const rootCommentId = target.parentId || target.id;
    expandedReplies.add(rootCommentId);
    await loadReplies(rootCommentId, 1);
    cancelReply();

    toast.add({ severity: 'success', summary: t('common.success'), detail: t('comment.submitSuccess'), life: 2200 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('comment.submitFailed'), life: 3000 });
  } finally {
    replySubmitting.value = false;
  }
}

async function handleDelete(comment) {
  const rootCommentId = comment.parentId || comment.id;

  try {
    await communityStore.deleteComment(props.postId, comment.id);

    if (comment.parentId) {
      expandedReplies.add(rootCommentId);
      await loadReplies(rootCommentId, 1);
    } else {
      expandedReplies.delete(rootCommentId);
      delete repliesMap[rootCommentId];
      delete repliesPageMap[rootCommentId];
      delete hasMoreRepliesMap[rootCommentId];
    }

    if (replyTarget.value) {
      const deletingActiveReply = String(replyTarget.value.id) === String(comment.id);
      const deletingActiveReplyParent = !comment.parentId
        && String(replyTarget.value.parentId || '') === String(comment.id);

      if (deletingActiveReply || deletingActiveReplyParent) {
        cancelReply();
      }
    }

    toast.add({ severity: 'success', summary: t('common.success'), detail: t('comment.deleteSuccess'), life: 2200 });
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('common.error'), life: 3000 });
  }
}

async function handleToggleReplies(comment) {
  if (expandedReplies.has(comment.id)) {
    expandedReplies.delete(comment.id);
    return;
  }

  expandedReplies.add(comment.id);
  if (!repliesMap[comment.id]) {
    await loadReplies(comment.id, 1);
  }
}

async function handleLoadMoreReplies(comment) {
  const currentPage = repliesPageMap[comment.id] || 1;
  await loadReplies(comment.id, currentPage + 1);
}

async function loadReplies(commentId, page) {
  try {
    const data = await communityStore.fetchReplies(props.postId, commentId, { page, size: 10 });
    const records = data.records || [];
    if (page === 1) {
      repliesMap[commentId] = records;
    } else {
      repliesMap[commentId] = [...(repliesMap[commentId] || []), ...records];
    }
    repliesPageMap[commentId] = page;
    const total = data.total || 0;
    hasMoreRepliesMap[commentId] = (repliesMap[commentId] || []).length < total;
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('common.error'), life: 3000 });
  }
}

async function handlePageChange(event) {
  try {
    await communityStore.fetchComments(props.postId, { page: event.page + 1, size: event.rows });
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || t('common.error'), life: 3000 });
  }
}
</script>

<style scoped>
.comment-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--app-border);
}

.comment-section-header {
  margin-bottom: 0.75rem;
}

.comment-section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.comment-section-count {
  font-weight: 400;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
}

.comment-compose {
  margin-bottom: 1rem;
}

.comment-compose-input {
  width: 100%;
  min-height: 4.4rem;
  border-color: var(--app-border-strong) !important;
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent) !important;
  color: var(--text-color) !important;
  box-shadow: none !important;
}

.comment-compose-input::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 78%, transparent) !important;
  opacity: 1;
}

.comment-compose-input:enabled:hover {
  border-color: color-mix(in srgb, var(--primary-color) 36%, var(--app-border-strong)) !important;
}

.comment-compose-input:enabled:focus {
  border-color: color-mix(in srgb, var(--primary-color) 58%, var(--app-border-strong)) !important;
  background: color-mix(in srgb, var(--app-panel-raised) 88%, var(--app-panel-inset)) !important;
  box-shadow: 0 0 0 3px var(--app-focus-ring) !important;
}

.comment-compose-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.comment-list {
  display: flex;
  flex-direction: column;
}

.comment-paginator {
  margin-top: 0.75rem;
}

.comment-paginator :deep(.p-paginator-content) {
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset) 95%, transparent);
}

.comment-loading {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
}

.comment-empty {
  padding: 2rem 0;
  text-align: center;
  color: var(--text-color-secondary);
}

.comment-empty i {
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
  display: block;
}

.comment-empty p {
  margin: 0;
  font-size: 0.88rem;
}
</style>
