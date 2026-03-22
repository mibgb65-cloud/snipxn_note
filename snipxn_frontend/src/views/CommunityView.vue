<template>
  <div class="community-shell animate-fade-in">
    <div class="community-frame">
      <header class="community-topbar animate-fade-in-up delay-100">
        <div class="community-brand-block">
          <div class="community-brand-icon">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="36" height="36">
          </div>

          <div class="community-brand-copy">
            <div class="community-eyebrow">{{ t('app.name') }}</div>
            <h1 class="community-title">{{ t('community.title') }}</h1>
          </div>
        </div>

        <div class="community-scope-banner">
          <div class="community-section-kicker">{{ activeScopeTitle }}</div>
          <p class="community-scope-copy">{{ activeScopeDescription }}</p>
        </div>

        <div class="community-topbar-side">
          <div class="community-summary">
            <article v-for="item in communityMetrics" :key="item.id" class="community-summary-card">
              <span class="community-summary-value">{{ item.value }}</span>
              <span class="community-summary-label">{{ item.label }}</span>
            </article>
          </div>

          <div class="community-topbar-actions">
            <div class="community-control-group">
              <ThemeToggle />
              <LangToggle />
            </div>

            <Button
              icon="pi pi-arrow-left"
              :label="t('community.backToWorkspace')"
              severity="secondary"
              outlined
              @click="router.push('/workspace')"
            />

            <Button
              icon="pi pi-pencil"
              :label="t('community.publish')"
              class="community-publish-btn"
              @click="composerVisible = true"
            />
          </div>
        </div>
      </header>

      <div class="community-body animate-fade-in-up delay-150" :class="{ 'community-body-stacked': isCommunityStacked }">
        <aside class="community-sidebar-shell">
          <div class="community-sidebar">
            <section class="community-sidebar-section">
              <div class="community-section-kicker">{{ t('community.communitySummary') }}</div>
              <p class="community-sidebar-copy">{{ t('community.subtitle') }}</p>

              <div class="community-sidebar-metrics">
                <article v-for="item in communityMetrics" :key="`sidebar-${item.id}`" class="community-sidebar-metric">
                  <span class="community-sidebar-metric-label">{{ item.label }}</span>
                  <strong class="community-sidebar-metric-value">{{ item.value }}</strong>
                </article>
              </div>
            </section>

            <section class="community-sidebar-section">
              <div class="community-sidebar-header">
                <h2 class="community-sidebar-title">{{ t('community.feed') }}</h2>
                <span class="community-sidebar-caption">{{ t('community.feedHint') }}</span>
              </div>

              <div class="community-scope-list">
                <button
                  type="button"
                  class="community-scope-button"
                  :class="{ 'community-scope-button-active': activeFeedScope === 'feed' }"
                  @click="handleChangeScope('feed')"
                >
                  <span class="community-scope-icon"><i class="pi pi-globe" /></span>
                  <span class="community-scope-main">
                    <span class="community-scope-label">{{ t('community.feed') }}</span>
                    <span class="community-scope-meta">{{ t('community.scopeFeedDescription') }}</span>
                  </span>
                </button>

                <button
                  type="button"
                  class="community-scope-button"
                  :class="{ 'community-scope-button-active': activeFeedScope === 'mine' }"
                  @click="handleChangeScope('mine')"
                >
                  <span class="community-scope-icon"><i class="pi pi-file-edit" /></span>
                  <span class="community-scope-main">
                    <span class="community-scope-label">{{ t('community.myPosts') }}</span>
                    <span class="community-scope-meta">{{ t('community.scopeMineDescription') }}</span>
                  </span>
                </button>
              </div>
            </section>

            <section class="community-sidebar-section community-sidebar-action-card">
              <div class="community-sidebar-header">
                <h2 class="community-sidebar-title">{{ t('community.quickActions') }}</h2>
              </div>

              <p class="community-sidebar-copy">{{ t('community.quickActionPublishHint') }}</p>
              <Button
                icon="pi pi-plus"
                :label="t('community.quickActionPublish')"
                class="community-sidebar-publish"
                @click="composerVisible = true"
              />
            </section>
          </div>
        </aside>

        <div class="community-main">
          <section class="community-feed-panel">
            <div class="community-feed-header">
              <div>
                <div class="community-section-kicker">{{ activeScopeTitle }}</div>
                <h2 class="community-feed-title">{{ activeScopeTitle }}</h2>
                <p class="community-feed-body">{{ activeScopeDescription }}</p>
              </div>

              <div class="community-feed-meta">
                <span class="community-feed-badge">{{ communityStore.total || communityStore.posts.length }} {{ t('community.postsMetric') }}</span>
                <span class="community-feed-badge">{{ topTags.length }} {{ t('community.hotTags') }}</span>
              </div>
            </div>

            <div v-if="bootstrapping && !communityStore.posts.length" class="community-loading-state">
              <span class="community-loading-text">{{ t('common.loading') }}</span>
            </div>

            <div v-else-if="communityStore.posts.length" class="community-post-list">
              <PostCard
                v-for="post in communityStore.posts"
                :key="post.id"
                :post="post"
                @click="handleOpenPost"
              />
            </div>

            <div v-else class="community-empty-state">
              <div class="community-empty-icon">
                <i class="pi pi-comments" />
              </div>
              <h3 class="community-empty-title">{{ emptyStateTitle }}</h3>
              <p class="community-empty-body">{{ emptyStateBody }}</p>
              <Button icon="pi pi-plus" :label="t('community.publish')" @click="composerVisible = true" />
            </div>

            <Paginator
              v-if="communityStore.total > 0"
              class="community-paginator"
              :first="(communityStore.page - 1) * communityStore.size"
              :rows="communityStore.size"
              :total-records="communityStore.total"
              @page="handlePageChange"
            />
          </section>

          <aside class="community-insights-shell">
            <div class="community-insights">
              <section v-if="featuredPost" class="community-insight-card">
                <div class="community-section-kicker">{{ t('community.featuredPost') }}</div>
                <button type="button" class="community-featured-post" @click="handleOpenPost(featuredPost.id)">
                  <span class="community-featured-title">{{ featuredPost.title }}</span>
                  <span class="community-featured-meta">{{ featuredPost.authorNickname || t('common.unknown') }}</span>
                </button>
              </section>

              <section class="community-insight-card">
                <div class="community-section-kicker">{{ t('community.hotTags') }}</div>
                <div v-if="topTags.length" class="community-topic-list">
                  <span v-for="tag in topTags" :key="tag.label" class="community-topic-chip">
                    <span>{{ tag.label }}</span>
                    <strong>{{ tag.count }}</strong>
                  </span>
                </div>
                <p v-else class="community-empty-copy">{{ t('community.noTags') }}</p>
              </section>

              <section class="community-insight-card">
                <div class="community-section-kicker">{{ t('community.activeLanguages') }}</div>
                <div v-if="topLanguages.length" class="community-topic-list">
                  <span v-for="language in topLanguages" :key="language.label" class="community-topic-chip">
                    <span>{{ language.label }}</span>
                    <strong>{{ language.count }}</strong>
                  </span>
                </div>
                <p v-else class="community-empty-copy">{{ t('community.noLanguages') }}</p>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="composerVisible"
      modal
      maximizable
      :draggable="false"
      :style="{ width: 'min(760px, 94vw)' }"
      :header="t('community.publish')"
      @hide="resetComposer"
    >
      <form class="community-compose-form" @submit.prevent="handlePublish">
        <div class="community-form-field">
          <label class="community-form-label" for="post-title">{{ t('community.postTitle') }}</label>
          <InputText
            id="post-title"
            v-model="composer.title"
            :placeholder="t('community.postTitlePlaceholder')"
          />
        </div>

        <div class="community-form-field">
          <label class="community-form-label" for="post-content">{{ t('community.postContent') }}</label>
          <Textarea
            id="post-content"
            v-model="composer.content"
            rows="10"
            auto-resize
            :placeholder="t('community.postContentPlaceholder')"
          />
        </div>

        <div class="community-form-grid">
          <div class="community-form-field">
            <label class="community-form-label" for="post-language">{{ t('community.postLanguage') }}</label>
            <InputText
              id="post-language"
              v-model="composer.language"
              :placeholder="t('community.postLanguagePlaceholder')"
            />
          </div>

          <div class="community-form-field">
            <label class="community-form-label" for="post-tags">{{ t('community.postTags') }}</label>
            <InputText
              id="post-tags"
              v-model="composer.tags"
              :placeholder="t('community.postTagsPlaceholder')"
            />
          </div>
        </div>

        <div class="community-form-field">
          <label class="community-form-label" for="post-origin-note">{{ t('community.originNoteId') }}</label>
          <InputText
            id="post-origin-note"
            v-model="composer.originNoteId"
            :placeholder="t('community.originNoteIdPlaceholder')"
          />
        </div>

        <div class="community-compose-actions">
          <Button
            type="button"
            :label="t('common.cancel')"
            severity="secondary"
            text
            @click="composerVisible = false"
          />
          <Button
            type="submit"
            :label="t('community.publish')"
            icon="pi pi-send"
            :loading="publishing"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Textarea from 'primevue/textarea';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import PostCard from '../components/community/PostCard.vue';
import logoUrl from '../assets/logo.svg';
import { useAuthStore } from '../stores/auth';
import { useCommunityStore } from '../stores/community';

const COMMUNITY_STACKED_BREAKPOINT = 1160;

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const communityStore = useCommunityStore();

const bootstrapping = ref(true);
const composerVisible = ref(false);
const publishing = ref(false);
const activeFeedScope = ref('feed');
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1360);
const composer = reactive({
  title: '',
  content: '',
  language: '',
  tags: '',
  originNoteId: '',
});

const currentUserId = computed(() => authStore.user?.id ?? null);
const isCommunityStacked = computed(() => windowWidth.value <= COMMUNITY_STACKED_BREAKPOINT);
const activeScopeTitle = computed(() => (
  activeFeedScope.value === 'mine' ? t('community.myPosts') : t('community.feed')
));
const activeScopeDescription = computed(() => (
  activeFeedScope.value === 'mine'
    ? t('community.scopeMineDescription')
    : t('community.scopeFeedDescription')
));
const topTags = computed(() => summarizeCollection((post) => post.tags || []));
const topLanguages = computed(() => summarizeCollection((post) => [post.language].filter(Boolean)));
const featuredPost = computed(() => {
  return [...communityStore.posts]
    .sort((left, right) => scorePost(right) - scorePost(left))[0] || null;
});
const communityMetrics = computed(() => ([
  { id: 'posts', label: t('community.postsMetric'), value: communityStore.total || communityStore.posts.length },
  { id: 'following', label: t('community.following'), value: communityStore.followingIds.length },
  { id: 'languages', label: t('community.languagesMetric'), value: topLanguages.value.length },
]));
const emptyStateTitle = computed(() => (
  activeFeedScope.value === 'mine' ? t('community.noOwnPosts') : t('community.noPosts')
));
const emptyStateBody = computed(() => (
  activeFeedScope.value === 'mine' ? t('community.noOwnPostsDescription') : t('community.noPostsDescription')
));

function showError(error, fallbackMessage) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error?.message || fallbackMessage,
    life: 3200,
  });
}

function resetComposer() {
  composer.title = '';
  composer.content = '';
  composer.language = '';
  composer.tags = '';
  composer.originNoteId = '';
}

function parseTags(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function scorePost(post = {}) {
  return Number(post.likeCount || 0) * 4 + Number(post.collectCount || 0) * 3 + Number(post.viewCount || 0);
}

function summarizeCollection(extractor) {
  const counter = new Map();

  communityStore.posts.forEach((post) => {
    extractor(post)
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .forEach((item) => {
        counter.set(item, (counter.get(item) || 0) + 1);
      });
  });

  return [...counter.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 8);
}

function lockCommunityViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('workspace-locked');
  document.body.classList.add('workspace-locked');
}

function unlockCommunityViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('workspace-locked');
  document.body.classList.remove('workspace-locked');
}

function handleResize() {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
}

async function loadActiveScope(options = {}) {
  if (activeFeedScope.value === 'mine' && currentUserId.value) {
    return communityStore.fetchUserPosts(currentUserId.value, options);
  }

  return communityStore.fetchPosts(options);
}

async function bootstrapCommunity() {
  bootstrapping.value = true;

  const results = await Promise.allSettled([
    loadActiveScope(),
    communityStore.fetchFollowing(),
  ]);

  const rejected = results.find((result) => result.status === 'rejected');

  if (rejected?.status === 'rejected') {
    showError(rejected.reason, t('community.loadFailed'));
  }

  bootstrapping.value = false;
}

async function handleChangeScope(scope) {
  if (scope === activeFeedScope.value) {
    return;
  }

  activeFeedScope.value = scope;

  try {
    await loadActiveScope({ page: 1, size: communityStore.size });
  } catch (error) {
    showError(error, t('community.loadFailed'));
  }
}

function handleOpenPost(postId) {
  router.push(`/community/${postId}`);
}

async function handlePageChange(event) {
  try {
    await loadActiveScope({
      page: event.page + 1,
      size: event.rows,
    });
  } catch (error) {
    showError(error, t('community.loadFailed'));
  }
}

async function handlePublish() {
  if (!composer.title.trim()) {
    showError(null, t('community.titleRequired'));
    return;
  }

  if (!composer.content.trim()) {
    showError(null, t('community.contentRequired'));
    return;
  }

  publishing.value = true;

  try {
    await communityStore.createPost({
      title: composer.title.trim(),
      content: composer.content,
      language: composer.language.trim() || undefined,
      tags: parseTags(composer.tags),
      originNoteId: composer.originNoteId.trim() || undefined,
    });

    await loadActiveScope({ page: 1, size: communityStore.size });
    composerVisible.value = false;
    resetComposer();

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('community.publishSuccess'),
      life: 2500,
    });
  } catch (error) {
    showError(error, t('community.publishFailed'));
  } finally {
    publishing.value = false;
  }
}

onMounted(() => {
  lockCommunityViewport();
  bootstrapCommunity();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  unlockCommunityViewport();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.community-shell {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.community-shell > * {
  min-width: 0;
  min-height: 0;
}

.community-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.community-topbar {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(280px, 1fr) minmax(360px, auto);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.community-brand-block,
.community-topbar-side,
.community-summary,
.community-topbar-actions,
.community-control-group,
.community-sidebar-header,
.community-feed-header,
.community-feed-meta,
.community-compose-actions {
  display: flex;
  align-items: center;
}

.community-brand-block {
  gap: 0.7rem;
  min-width: 0;
}

.community-brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
}

.community-brand-copy,
.community-scope-banner {
  min-width: 0;
}

.community-eyebrow,
.community-section-kicker,
.community-sidebar-metric-label,
.community-summary-label,
.community-feed-badge,
.community-sidebar-caption {
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.community-eyebrow,
.community-section-kicker {
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.community-title,
.community-feed-title,
.community-sidebar-title {
  margin: 0;
  letter-spacing: -0.04em;
}

.community-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  line-height: 1;
}

.community-scope-copy,
.community-feed-body,
.community-sidebar-copy,
.community-empty-body,
.community-empty-copy {
  margin: 0.2rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.community-topbar-side {
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: 0;
}

.community-summary {
  gap: 0.55rem;
}

.community-summary-card {
  min-width: 4.9rem;
  padding: 0.35rem 0.65rem;
  border-left: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.community-summary-value,
.community-sidebar-metric-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.1;
}

.community-summary-label,
.community-sidebar-metric-label,
.community-feed-badge,
.community-sidebar-caption {
  color: var(--text-color-secondary);
}

.community-topbar-actions {
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.community-control-group {
  gap: 0.3rem;
  padding-right: 0.5rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--app-border);
}

.community-publish-btn {
  min-width: max-content;
}

.community-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.community-body-stacked {
  flex-direction: column;
}

.community-sidebar-shell {
  flex: 0 0 270px;
  min-width: 270px;
  max-width: 320px;
  min-height: 0;
  border-right: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.community-sidebar,
.community-feed-panel,
.community-insights {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.community-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.community-sidebar-section,
.community-feed-panel,
.community-insight-card {
  padding: 1rem;
}

.community-sidebar-section + .community-sidebar-section,
.community-insight-card + .community-insight-card {
  border-top: 1px solid var(--app-border);
}

.community-sidebar-metrics,
.community-scope-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.community-sidebar-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.community-sidebar-title {
  font-size: 1rem;
}

.community-scope-button {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.community-scope-button:hover,
.community-scope-button-active {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-strong));
}

.community-scope-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  color: var(--primary-color);
  flex-shrink: 0;
}

.community-scope-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.community-scope-label {
  font-weight: 700;
  color: var(--text-color);
}

.community-scope-meta {
  color: var(--text-color-secondary);
  line-height: 1.55;
  font-size: 0.86rem;
}

.community-sidebar-action-card {
  margin-top: auto;
  background: color-mix(in srgb, var(--primary-color) 5%, var(--app-panel-subtle));
}

.community-sidebar-publish {
  margin-top: 0.85rem;
  width: 100%;
}

.community-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
}

.community-feed-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.community-feed-header {
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--app-border);
  flex-wrap: wrap;
}

.community-feed-title {
  margin-top: 0.25rem;
  font-size: 1.3rem;
}

.community-feed-meta {
  gap: 0.45rem;
  flex-wrap: wrap;
}

.community-feed-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
}

.community-post-list {
  display: flex;
  flex-direction: column;
}

.community-loading-state,
.community-empty-state {
  flex: 1;
  min-height: 18rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: center;
  padding: 2rem 1rem;
}

.community-loading-text,
.community-empty-copy {
  color: var(--text-color-secondary);
}

.community-empty-icon {
  width: 3.25rem;
  height: 3.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
  color: var(--primary-color);
}

.community-empty-title {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.community-paginator {
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--app-border);
}

.community-insights-shell {
  border-left: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.community-insights {
  display: flex;
  flex-direction: column;
}

.community-featured-post {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.85rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
  text-align: left;
  cursor: pointer;
}

.community-featured-title {
  font-weight: 700;
  line-height: 1.45;
  color: var(--text-color);
}

.community-featured-meta {
  color: var(--text-color-secondary);
  font-size: 0.84rem;
}

.community-topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.community-topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
  font-size: 0.84rem;
}

.community-compose-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.community-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.community-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.community-form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.community-compose-actions {
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.community-compose-form :deep(.p-inputtext),
.community-compose-form :deep(.p-textarea) {
  width: 100%;
}

.community-compose-form :deep(.p-textarea) {
  min-height: 16rem;
  line-height: 1.65;
}

@media (max-width: 1280px) {
  .community-topbar {
    grid-template-columns: minmax(0, 220px) minmax(220px, 1fr) minmax(0, auto);
  }

  .community-main {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

@media (max-width: 1160px) {
  .community-sidebar-shell {
    flex-basis: auto;
    min-width: 100%;
    max-width: none;
    border-right: 0;
    border-bottom: 1px solid var(--app-border);
  }

  .community-main {
    grid-template-columns: 1fr;
  }

  .community-insights-shell {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }
}

@media (max-width: 980px) {
  .community-topbar {
    grid-template-columns: 1fr;
  }

  .community-topbar-side {
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .community-summary {
    width: 100%;
    flex-wrap: wrap;
  }

  .community-summary-card {
    flex: 1 1 calc(50% - 0.35rem);
    min-width: 0;
    border: 1px solid var(--app-border);
  }

  .community-topbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .community-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .community-topbar-actions :deep(.p-button-label) {
    display: none;
  }

  .community-publish-btn :deep(.p-button-label) {
    display: inline;
  }
}
</style>
