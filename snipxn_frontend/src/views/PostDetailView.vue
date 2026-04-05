<template>
  <div class="post-detail-shell animate-fade-in">
    <div class="post-detail-frame">
      <header class="post-detail-topbar animate-fade-in-up delay-100">
        <div class="post-detail-brand">
          <div class="post-detail-brand-icon">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="34" height="34">
          </div>

          <div class="post-detail-brand-copy">
            <div class="post-detail-eyebrow">{{ t('app.name') }}</div>
            <h1 class="post-detail-page-title">{{ t('community.title') }}</h1>
          </div>
        </div>

        <div class="post-detail-banner">
          <div class="post-detail-eyebrow">{{ t('community.detailArticle') }}</div>
          <p class="post-detail-banner-copy">{{ post?.title || t('community.postNotFound') }}</p>
        </div>

        <div class="post-detail-topbar-actions">
          <div class="post-detail-control-group">
            <ThemeToggle />
            <LangToggle />
          </div>

          <Button
            icon="pi pi-arrow-left"
            :label="t('community.backToCommunity')"
            severity="secondary"
            outlined
            @click="router.push('/community')"
          />
        </div>
      </header>

      <div class="post-detail-body animate-fade-in-up delay-150" :class="{ 'post-detail-body-stacked': isDetailStacked }">
        <main class="post-detail-main">
          <section v-if="communityStore.loadingDetail" class="post-detail-article">
            <div class="post-detail-author-row">
              <div class="post-detail-author-shell">
                <Skeleton shape="circle" size="2.75rem" />
                <div class="post-detail-author-copy">
                  <Skeleton width="8rem" height="1rem" />
                  <Skeleton width="6rem" height="0.9rem" />
                </div>
              </div>
            </div>

            <div class="post-detail-skeleton-copy">
              <Skeleton width="70%" height="2.5rem" />
              <div class="post-detail-skeleton-tags">
                <Skeleton width="5rem" height="1.8rem" />
                <Skeleton width="4rem" height="1.8rem" />
                <Skeleton width="4.5rem" height="1.8rem" />
              </div>
              <Skeleton v-for="index in 7" :key="index" width="100%" height="1rem" />
              <Skeleton width="82%" height="1rem" />
              <Skeleton width="93%" height="1rem" />
            </div>
          </section>

          <section v-else-if="post" class="post-detail-article">
            <div class="post-detail-author-row">
              <div class="post-detail-author-shell">
                <Avatar
                  :image="post.authorAvatar"
                  :label="(post.authorNickname || '?')[0]"
                  shape="circle"
                  size="large"
                />

                <div class="post-detail-author-copy">
                  <div class="post-detail-author-name">
                    {{ post.authorNickname || t('common.unknown') }}
                  </div>
                  <div class="post-detail-author-meta">
                    {{ t('community.publishedAt') }} {{ formattedCreatedAt }}
                  </div>
                </div>
              </div>
            </div>

            <h1 class="post-detail-title">{{ post.title }}</h1>

            <div v-if="post.language || post.tags?.length" class="post-detail-tags">
              <Tag v-if="post.language" :value="post.language" severity="info" />
              <Tag v-for="tag in (post.tags || [])" :key="tag" :value="tag" severity="secondary" />
            </div>

            <article
              ref="postDetailMarkdownContentRef"
              class="post-detail-body-copy"
              v-html="renderedContent"
            />
          </section>

          <section v-else class="post-detail-empty">
            <div class="post-detail-empty-icon">
              <i class="pi pi-file-excel" />
            </div>
            <h2 class="post-detail-empty-title">{{ t('community.postNotFound') }}</h2>
            <p class="post-detail-empty-body">{{ t('community.postNotFoundDescription') }}</p>
            <Button :label="t('community.backToCommunity')" icon="pi pi-arrow-left" @click="router.push('/community')" />
          </section>
        </main>

        <aside class="post-detail-sidebar">
          <div v-if="communityStore.loadingDetail" class="post-detail-sidebar-stack">
            <section class="post-detail-sidebar-card">
              <Skeleton width="7rem" height="0.95rem" />
              <Skeleton width="100%" height="2.8rem" />
              <Skeleton width="100%" height="2.8rem" />
            </section>
          </div>

          <div v-else-if="post" class="post-detail-sidebar-stack">
            <section class="post-detail-sidebar-card">
              <div class="post-detail-section-kicker">{{ t('community.detailStats') }}</div>
              <div class="post-detail-metrics">
                <article v-for="item in detailMetrics" :key="item.id" class="post-detail-metric">
                  <span class="post-detail-metric-label">{{ item.label }}</span>
                  <strong class="post-detail-metric-value">{{ item.value }}</strong>
                </article>
              </div>
            </section>

            <section class="post-detail-sidebar-card">
              <div class="post-detail-section-kicker">{{ t('community.detailAboutAuthor') }}</div>
              <div class="post-detail-sidebar-author">
                <Avatar
                  :image="post.authorAvatar"
                  :label="(post.authorNickname || '?')[0]"
                  shape="circle"
                  size="large"
                />
                <div class="post-detail-sidebar-author-copy">
                  <strong>{{ post.authorNickname || t('common.unknown') }}</strong>
                  <span>{{ t('community.publishedAt') }} {{ formattedCreatedAt }}</span>
                </div>
              </div>

              <Button
                v-if="showFollowAction"
                :label="isFollowingAuthor ? t('community.following') : t('community.follow')"
                :severity="isFollowingAuthor ? 'secondary' : undefined"
                :outlined="isFollowingAuthor"
                :loading="followLoading"
                class="post-detail-follow-btn"
                @click="handleToggleFollow"
              />
            </section>

            <section class="post-detail-sidebar-card">
              <div class="post-detail-section-kicker">{{ t('community.detailLanguage') }}</div>
              <div class="post-detail-meta-value">{{ post.language || '-' }}</div>

              <div class="post-detail-section-kicker post-detail-subsection">{{ t('community.detailTags') }}</div>
              <div v-if="post.tags?.length" class="post-detail-meta-tags">
                <span v-for="tag in post.tags" :key="tag" class="post-detail-chip">{{ tag }}</span>
              </div>
              <p v-else class="post-detail-empty-copy">{{ t('community.detailNoTags') }}</p>

              <div v-if="post.originNoteId" class="post-detail-origin-block">
                <div class="post-detail-section-kicker post-detail-subsection">{{ t('community.detailSourceNote') }}</div>
                <div class="post-detail-meta-value">#{{ post.originNoteId }}</div>
              </div>
            </section>

            <section class="post-detail-sidebar-card">
              <div class="post-detail-section-kicker">{{ t('community.detailActions') }}</div>
              <div class="post-detail-action-stack">
                <Button
                  :icon="post.liked ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  :label="`${t('community.likes')} ${post.likeCount || 0}`"
                  :severity="post.liked ? 'danger' : 'secondary'"
                  :outlined="!post.liked"
                  @click="handleToggleLike"
                />

                <Button
                  :icon="post.collected ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                  :label="`${t('community.collects')} ${post.collectCount || 0}`"
                  :severity="post.collected ? 'contrast' : 'secondary'"
                  :outlined="!post.collected"
                  @click="handleToggleCollect"
                />

                <Button
                  v-if="isOwnPost"
                  icon="pi pi-trash"
                  :label="t('common.delete')"
                  severity="danger"
                  outlined
                  @click="deleteDialogVisible = true"
                />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :draggable="false"
      :header="t('common.delete')"
      :style="{ width: 'min(420px, 92vw)' }"
    >
      <div class="post-detail-delete-dialog">
        <p class="m-0">{{ t('community.deleteConfirm') }}</p>

        <div class="post-detail-delete-actions">
          <Button
            :label="t('common.cancel')"
            severity="secondary"
            text
            @click="deleteDialogVisible = false"
          />
          <Button
            :label="t('common.delete')"
            severity="danger"
            :loading="deleting"
            @click="handleDeletePost"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import { useLogoUrl } from '../composables/useLogoUrl';

const { logoUrl } = useLogoUrl();
import { useAuthStore } from '../stores/auth';
import { useCommunityStore } from '../stores/community';
import { bindMarkdownCodeActions, renderMarkdown } from '../utils/markdown';

const DETAIL_STACKED_BREAKPOINT = 1080;

const route = useRoute();
const router = useRouter();
const { locale, t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const communityStore = useCommunityStore();

const deleteDialogVisible = ref(false);
const deleting = ref(false);
const followLoading = ref(false);
const postDetailMarkdownContentRef = ref(null);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
let teardownPostDetailMarkdownCodeActions = null;

const postId = computed(() => route.params.postId);
const post = computed(() => communityStore.currentPost);
const currentUserId = computed(() => authStore.user?.id ?? null);
const isDetailStacked = computed(() => windowWidth.value <= DETAIL_STACKED_BREAKPOINT);
const isOwnPost = computed(() => (
  Boolean(post.value?.userId) && String(post.value.userId) === String(currentUserId.value)
));
const showFollowAction = computed(() => Boolean(post.value?.userId) && !isOwnPost.value);
const isFollowingAuthor = computed(() => (
  Boolean(post.value?.userId) && communityStore.isFollowing(post.value.userId)
));
const formattedCreatedAt = computed(() => {
  if (!post.value?.createdAt) {
    return '';
  }

  const date = new Date(post.value.createdAt);

  if (Number.isNaN(date.getTime())) {
    return post.value.createdAt;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
});
const renderedContent = computed(() => renderMarkdown(post.value?.content || '', {
  enhancedCodeBlocks: true,
  copyButtonLabel: t('common.copy'),
  defaultCodeLanguageLabel: t('common.plainText'),
}));
const detailMetrics = computed(() => ([
  { id: 'views', label: t('community.views'), value: post.value?.viewCount || 0 },
  { id: 'likes', label: t('community.likes'), value: post.value?.likeCount || 0 },
  { id: 'collects', label: t('community.collects'), value: post.value?.collectCount || 0 },
]));

function showError(error, fallbackMessage) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error?.message || fallbackMessage,
    life: 3200,
  });
}

function cleanupPostDetailMarkdownCodeActions() {
  if (typeof teardownPostDetailMarkdownCodeActions === 'function') {
    teardownPostDetailMarkdownCodeActions();
    teardownPostDetailMarkdownCodeActions = null;
  }
}

function setupPostDetailMarkdownCodeActions() {
  cleanupPostDetailMarkdownCodeActions();

  if (!postDetailMarkdownContentRef.value) {
    return;
  }

  teardownPostDetailMarkdownCodeActions = bindMarkdownCodeActions(postDetailMarkdownContentRef.value, {
    copyButtonLabel: t('common.copy'),
    copiedButtonLabel: t('common.copied'),
    onCopySuccess() {
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('community.copyCodeSuccess'),
        life: 1800,
      });
    },
    onCopyError(error) {
      showError(error, t('community.copyCodeFailed'));
    },
  });
}

function lockDetailViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('workspace-locked');
  document.body.classList.add('workspace-locked');
}

function unlockDetailViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('workspace-locked');
  document.body.classList.remove('workspace-locked');
}

function handleResize() {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
}

async function bootstrapPostDetail() {
  communityStore.currentPost = null;

  const [postResult, followingResult] = await Promise.allSettled([
    communityStore.fetchPost(postId.value),
    communityStore.fetchFollowing(),
  ]);

  if (postResult.status === 'rejected') {
    showError(postResult.reason, t('community.loadFailed'));
  }

  if (followingResult.status === 'rejected' && authStore.isAuthenticated) {
    showError(followingResult.reason, t('community.loadFailed'));
  }
}

async function handleToggleFollow() {
  if (!post.value?.userId) {
    return;
  }

  followLoading.value = true;

  try {
    await communityStore.toggleFollow(post.value.userId);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: isFollowingAuthor.value ? t('community.followSuccess') : t('community.unfollowSuccess'),
      life: 2200,
    });
  } catch (error) {
    showError(error, t('common.error'));
  } finally {
    followLoading.value = false;
  }
}

async function handleToggleLike() {
  try {
    await communityStore.toggleLike(postId.value);
  } catch (error) {
    showError(error, t('common.error'));
  }
}

async function handleToggleCollect() {
  try {
    await communityStore.toggleCollect(postId.value);
  } catch (error) {
    showError(error, t('common.error'));
  }
}

async function handleDeletePost() {
  deleting.value = true;

  try {
    await communityStore.deletePost(postId.value);
    deleteDialogVisible.value = false;

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('community.deleteSuccess'),
      life: 2400,
    });

    router.push('/community');
  } catch (error) {
    showError(error, t('common.error'));
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  lockDetailViewport();
  bootstrapPostDetail();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cleanupPostDetailMarkdownCodeActions();
  unlockDetailViewport();
  window.removeEventListener('resize', handleResize);
});

watch(postId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    bootstrapPostDetail();
  }
});

watch(
  [renderedContent, () => locale.value, () => postId.value],
  async () => {
    await nextTick();
    setupPostDetailMarkdownCodeActions();
  },
  { flush: 'post' },
);
</script>

<style scoped>
.post-detail-shell {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.post-detail-shell > * {
  min-width: 0;
  min-height: 0;
}

.post-detail-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.post-detail-topbar {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(280px, 1fr) minmax(300px, auto);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.post-detail-brand,
.post-detail-topbar-actions,
.post-detail-control-group,
.post-detail-author-row,
.post-detail-author-shell,
.post-detail-delete-actions,
.post-detail-skeleton-tags,
.post-detail-sidebar-author {
  display: flex;
  align-items: center;
}

.post-detail-brand {
  gap: 0.7rem;
  min-width: 0;
}

.post-detail-brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
}

.post-detail-brand-copy,
.post-detail-banner {
  min-width: 0;
}

.post-detail-eyebrow,
.post-detail-section-kicker,
.post-detail-metric-label {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.post-detail-page-title,
.post-detail-title {
  margin: 0;
  letter-spacing: -0.04em;
}

.post-detail-page-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  line-height: 1;
}

.post-detail-banner-copy,
.post-detail-author-meta,
.post-detail-sidebar-author-copy span,
.post-detail-empty-body,
.post-detail-empty-copy {
  margin: 0.2rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.post-detail-topbar-actions {
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.post-detail-control-group {
  gap: 0.3rem;
  padding-right: 0.5rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--app-border);
}

.post-detail-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
}

.post-detail-body-stacked {
  grid-template-columns: 1fr;
}

.post-detail-main,
.post-detail-sidebar {
  min-width: 0;
  min-height: 0;
}

.post-detail-main {
  overflow: auto;
}

.post-detail-sidebar {
  border-left: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  overflow: auto;
}

.post-detail-article,
.post-detail-empty {
  padding: 1.1rem;
}

.post-detail-article {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.post-detail-author-row {
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.post-detail-author-shell,
.post-detail-sidebar-author {
  gap: 0.85rem;
  min-width: 0;
}

.post-detail-author-copy,
.post-detail-sidebar-author-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.post-detail-author-name,
.post-detail-sidebar-author-copy strong {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.post-detail-title {
  font-size: clamp(1.9rem, 4vw, 3rem);
  line-height: 1.05;
  text-wrap: balance;
}

.post-detail-tags,
.post-detail-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.post-detail-body-copy {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.8;
}

.post-detail-body-copy :deep(h1),
.post-detail-body-copy :deep(h2),
.post-detail-body-copy :deep(h3),
.post-detail-body-copy :deep(h4) {
  margin: 1.6em 0 0.6em;
  line-height: 1.18;
  letter-spacing: -0.03em;
}

.post-detail-body-copy :deep(h1) {
  font-size: 2rem;
}

.post-detail-body-copy :deep(h2) {
  font-size: 1.55rem;
}

.post-detail-body-copy :deep(h3) {
  font-size: 1.2rem;
}

.post-detail-body-copy :deep(p),
.post-detail-body-copy :deep(ul),
.post-detail-body-copy :deep(blockquote),
.post-detail-body-copy :deep(pre) {
  margin: 0 0 1rem;
}

.post-detail-body-copy :deep(ul) {
  padding-left: 1.2rem;
}

.post-detail-body-copy :deep(code) {
  padding: 0.15rem 0.4rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.post-detail-body-copy :deep(pre) {
  overflow-x: auto;
  padding: 1rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  border: 1px solid var(--app-border);
}

.post-detail-body-copy :deep(.markdown-code-block) {
  margin: 0 0 1rem;
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  overflow: hidden;
}

.post-detail-body-copy :deep(.markdown-code-toolbar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 0.95rem;
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 88%, transparent);
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
}

.post-detail-body-copy :deep(.markdown-code-language) {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.post-detail-body-copy :deep(.markdown-code-copy) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.5rem;
  padding: 0.38rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: var(--text-color);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.post-detail-body-copy :deep(.markdown-code-copy:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
}

.post-detail-body-copy :deep(.markdown-code-copy:focus-visible) {
  outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
  outline-offset: 2px;
}

.post-detail-body-copy :deep(.markdown-code-copy[data-copied='true']) {
  border-color: color-mix(in srgb, var(--primary-color) 42%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-strong));
  color: var(--primary-color);
}

.post-detail-body-copy :deep(pre code) {
  padding: 0;
  background: transparent;
}

.post-detail-body-copy :deep(.markdown-code-block pre) {
  margin: 0;
  padding: 1rem 1rem 1.1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.post-detail-body-copy :deep(.markdown-code-block pre code) {
  display: block;
  min-width: max-content;
}

.post-detail-body-copy :deep(blockquote) {
  padding: 0.9rem 1rem;
  border-left: 4px solid color-mix(in srgb, var(--primary-color) 60%, transparent);
  background: color-mix(in srgb, var(--primary-color) 5%, var(--app-panel-strong));
  color: var(--text-color-secondary);
}

.post-detail-body-copy :deep(a) {
  color: var(--primary-color);
}

.post-detail-body-copy :deep(img) {
  border: 1px solid var(--app-border);
  margin: 1rem auto;
}

.post-detail-sidebar-stack {
  display: flex;
  flex-direction: column;
}

.post-detail-sidebar-card {
  padding: 1rem;
}

.post-detail-sidebar-card + .post-detail-sidebar-card {
  border-top: 1px solid var(--app-border);
}

.post-detail-metrics {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.post-detail-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.post-detail-metric-label {
  color: var(--text-color-secondary);
}

.post-detail-metric-value,
.post-detail-meta-value {
  color: var(--text-color);
  font-weight: 700;
}

.post-detail-follow-btn,
.post-detail-action-stack :deep(.p-button) {
  width: 100%;
}

.post-detail-follow-btn {
  margin-top: 0.85rem;
}

.post-detail-subsection {
  margin-top: 1rem;
}

.post-detail-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
  font-size: 0.84rem;
}

.post-detail-origin-block {
  margin-top: 1rem;
}

.post-detail-action-stack {
  display: grid;
  gap: 0.7rem;
  margin-top: 0.85rem;
}

.post-detail-empty {
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  text-align: center;
}

.post-detail-empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
  color: var(--primary-color);
}

.post-detail-empty-title {
  margin: 0;
  font-size: 1.25rem;
}

.post-detail-delete-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.post-detail-delete-actions {
  justify-content: flex-end;
  gap: 0.75rem;
}

.post-detail-skeleton-copy {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.post-detail-skeleton-tags {
  gap: 0.5rem;
}

@media (max-width: 1080px) {
  .post-detail-topbar {
    grid-template-columns: 1fr;
  }

  .post-detail-sidebar {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }
}

@media (max-width: 720px) {
  .post-detail-topbar-actions {
    justify-content: space-between;
  }

  .post-detail-topbar-actions :deep(.p-button-label) {
    display: none;
  }
}
</style>
