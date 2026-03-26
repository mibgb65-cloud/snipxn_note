<template>
  <div class="up-shell animate-fade-in">
    <div class="up-frame">
      <header class="up-topbar animate-fade-in-up delay-100">
        <div class="up-brand">
          <div class="up-brand-icon">
            <img :src="logoUrl" :alt="t('app.logoAlt')" width="34" height="34">
          </div>

          <div class="up-brand-copy">
            <div class="up-eyebrow">{{ t('app.name') }}</div>
            <h1 class="up-page-title">{{ t('community.title') }}</h1>
          </div>
        </div>

        <div class="up-banner">
          <div class="up-eyebrow">{{ t('community.userProfile.viewProfile') }}</div>
          <p class="up-banner-copy">{{ profile?.nickname || t('common.loading') }}</p>
        </div>

        <div class="up-topbar-actions">
          <div class="up-control-group">
            <ThemeToggle />
            <LangToggle />
          </div>

          <Button
            icon="pi pi-arrow-left"
            :label="t('common.back')"
            severity="secondary"
            outlined
            @click="handleGoBack"
          />
        </div>
      </header>

      <div class="up-body animate-fade-in-up delay-150" :class="{ 'up-body-stacked': isStacked }">
        <aside class="up-nav-shell">
          <div class="up-nav">
            <section class="up-nav-section">
              <div class="up-nav-header">
                <h2 class="up-nav-title">{{ t('community.userProfile.viewProfile') }}</h2>
                <span class="up-nav-caption">{{ profile?.nickname || t('common.loading') }}</span>
              </div>

              <div class="up-nav-list">
                <button type="button" class="up-nav-button up-nav-button-primary" @click="handleGoBack">
                  <span class="up-nav-icon"><i class="pi pi-arrow-left" /></span>
                  <span class="up-nav-main">
                    <span class="up-nav-label">{{ t('common.back') }}</span>
                    <span class="up-nav-description">{{ t('community.userProfile.backDescription') }}</span>
                  </span>
                </button>

                <button type="button" class="up-nav-button" @click="router.push('/community')">
                  <span class="up-nav-icon"><i class="pi pi-comments" /></span>
                  <span class="up-nav-main">
                    <span class="up-nav-label">{{ t('community.backToCommunity') }}</span>
                    <span class="up-nav-description">{{ t('community.userProfile.communityDescription') }}</span>
                  </span>
                </button>

                <button type="button" class="up-nav-button" @click="router.push('/workspace')">
                  <span class="up-nav-icon"><i class="pi pi-home" /></span>
                  <span class="up-nav-main">
                    <span class="up-nav-label">{{ t('community.backToWorkspace') }}</span>
                    <span class="up-nav-description">{{ t('community.userProfile.workspaceDescription') }}</span>
                  </span>
                </button>
              </div>
            </section>

            <div class="up-nav-footer">
              <div class="up-section-kicker">{{ t('community.userProfile.currentAccount') }}</div>
              <div class="up-nav-profile">
                <Avatar
                  v-if="displayUser?.avatar"
                  :image="displayUser.avatar"
                  shape="circle"
                  size="large"
                />
                <Avatar
                  v-else
                  :label="displayUserInitial"
                  shape="circle"
                  size="large"
                />

                <div class="up-nav-profile-copy">
                  <strong>{{ displayUserName }}</strong>
                  <span>{{ displayUser?.email || t('settings.profile') }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div class="up-content">
          <main class="up-main">
            <section v-if="communityStore.loadingProfile" class="up-article">
              <div class="up-author-row">
                <div class="up-author-shell">
                  <Skeleton shape="circle" size="3.5rem" />
                  <div class="up-author-copy">
                    <Skeleton width="10rem" height="1.2rem" />
                    <Skeleton width="7rem" height="0.9rem" />
                  </div>
                </div>
              </div>
              <div class="up-skeleton-posts">
                <Skeleton v-for="i in 3" :key="i" width="100%" height="6rem" />
              </div>
            </section>

            <section v-else-if="profile" class="up-article">
              <div class="up-author-row">
                <div class="up-author-shell">
                  <Avatar
                    v-if="profile.avatar"
                    :image="profile.avatar"
                    shape="circle"
                    size="xlarge"
                    class="up-avatar"
                  />
                  <Avatar
                    v-else
                    :label="avatarInitial"
                    shape="circle"
                    size="xlarge"
                    class="up-avatar"
                  />

                  <div class="up-author-copy">
                    <div class="up-author-name">{{ profile.nickname || t('common.unknown') }}</div>
                    <div v-if="profile.bio" class="up-author-bio">{{ profile.bio }}</div>
                    <!-- 所在地 & 公司 -->
                    <div v-if="profile.location || profile.company" class="up-author-meta">
                      <template v-if="profile.location">
                        <i class="pi pi-map-marker" />
                        <span>{{ profile.location }}</span>
                      </template>
                      <template v-if="profile.company">
                        <i class="pi pi-building" />
                        <span>{{ profile.company }}</span>
                      </template>
                    </div>

                    <!-- 网站 & GitHub 链接 -->
                    <div v-if="profile.website || profile.github" class="up-author-meta">
                      <template v-if="profile.website">
                        <i class="pi pi-globe" />
                        <a :href="profile.website" target="_blank" rel="noopener noreferrer" class="up-author-link">
                          {{ profile.website.replace(/^https?:\/\//, '') }}
                        </a>
                      </template>
                      <template v-if="profile.github">
                        <i class="pi pi-github" />
                        <a :href="'https://github.com/' + profile.github" target="_blank" rel="noopener noreferrer" class="up-author-link">
                          {{ profile.github }}
                        </a>
                      </template>
                    </div>

                    <!-- 技术栈标签 -->
                    <div v-if="profile.techStack" class="up-tech-tags">
                      <span
                        v-for="tag in profile.techStack.split(',').filter(Boolean)"
                        :key="tag"
                        class="up-tech-tag"
                      >{{ tag.trim() }}</span>
                    </div>
                    <div v-if="profile.createdAt" class="up-author-meta">
                      <i class="pi pi-calendar" />
                      {{ t('community.userProfile.joined') }} {{ formatDate(profile.createdAt) }}
                    </div>
                  </div>
                </div>

                <Button
                  v-if="!isSelf"
                  :label="profile.isFollowing ? t('community.userProfile.unfollow') : t('community.userProfile.follow')"
                  :severity="profile.isFollowing ? 'secondary' : undefined"
                  :outlined="!profile.isFollowing"
                  :loading="followLoading"
                  @click="handleToggleFollow"
                />
              </div>

              <div class="up-section-kicker">{{ t('community.userProfile.posts') }}</div>

              <div v-if="communityStore.loadingList" class="up-loading-state">
                <span class="up-loading-text">{{ t('common.loading') }}</span>
              </div>

              <div v-else-if="communityStore.posts.length" class="up-post-list">
                <PostCard
                  v-for="post in communityStore.posts"
                  :key="post.id"
                  :post="post"
                  @click="handleOpenPost"
                />
              </div>

              <div v-else class="up-empty-state">
                <div class="up-empty-icon"><i class="pi pi-inbox" /></div>
                <h3 class="up-empty-title">{{ t('community.userProfile.noPosts') }}</h3>
              </div>

              <Paginator
                v-if="communityStore.posts.length && communityStore.total > communityStore.size"
                class="up-paginator"
                :first="(postPage - 1) * communityStore.size"
                :rows="communityStore.size"
                :total-records="communityStore.total"
                @page="handlePageChange"
              />
            </section>
          </main>

          <aside class="up-sidebar">
            <div v-if="communityStore.loadingProfile" class="up-sidebar-stack">
              <section class="up-sidebar-card">
                <Skeleton width="7rem" height="0.95rem" />
                <Skeleton width="100%" height="2.8rem" />
                <Skeleton width="100%" height="2.8rem" />
                <Skeleton width="100%" height="2.8rem" />
              </section>
            </div>

            <div v-else-if="profile" class="up-sidebar-stack">
              <section class="up-sidebar-card">
                <div class="up-section-kicker">{{ t('community.detailStats') }}</div>
                <div class="up-metrics">
                  <article class="up-metric">
                    <span class="up-metric-label">{{ t('community.userProfile.posts') }}</span>
                    <strong class="up-metric-value">{{ profile.postCount || 0 }}</strong>
                  </article>
                  <article class="up-metric">
                    <span class="up-metric-label">{{ t('community.userProfile.followers') }}</span>
                    <strong class="up-metric-value">{{ profile.followerCount || 0 }}</strong>
                  </article>
                  <article class="up-metric">
                    <span class="up-metric-label">{{ t('community.userProfile.following') }}</span>
                    <strong class="up-metric-value">{{ profile.followingCount || 0 }}</strong>
                  </article>
                </div>
              </section>

              <section class="up-sidebar-card">
                <div class="up-section-kicker">{{ t('community.detailAboutAuthor') }}</div>
                <div class="up-sidebar-author">
                  <Avatar
                    v-if="profile.avatar"
                    :image="profile.avatar"
                    shape="circle"
                    size="large"
                  />
                  <Avatar
                    v-else
                    :label="avatarInitial"
                    shape="circle"
                    size="large"
                  />
                  <div class="up-sidebar-author-copy">
                    <strong>{{ profile.nickname || t('common.unknown') }}</strong>
                    <span v-if="profile.bio">{{ profile.bio }}</span>
                    <span v-if="profile.location" class="up-sidebar-meta">
                      <i class="pi pi-map-marker" /> {{ profile.location }}
                    </span>
                    <span v-if="profile.company" class="up-sidebar-meta">
                      <i class="pi pi-building" /> {{ profile.company }}
                    </span>
                  </div>
                </div>

                <Button
                  v-if="!isSelf"
                  :label="profile.isFollowing ? t('community.userProfile.unfollow') : t('community.userProfile.follow')"
                  :severity="profile.isFollowing ? 'secondary' : undefined"
                  :outlined="!profile.isFollowing"
                  :loading="followLoading"
                  class="up-follow-btn"
                  @click="handleToggleFollow"
                />
              </section>

              <section v-if="profile.website || profile.github || profile.techStack" class="up-sidebar-card">
                <div class="up-section-kicker">{{ t('profile.techStack') }}</div>
                <div v-if="profile.techStack" class="up-tech-tags" style="margin-top: 0.5rem;">
                  <span
                    v-for="tag in profile.techStack.split(',').filter(Boolean)"
                    :key="tag"
                    class="up-tech-tag"
                  >{{ tag.trim() }}</span>
                </div>
                <div v-if="profile.website" class="up-meta-value" style="margin-top: 0.6rem;">
                  <i class="pi pi-globe" />
                  <a :href="profile.website" target="_blank" rel="noopener noreferrer" class="up-author-link">
                    {{ profile.website.replace(/^https?:\/\//, '') }}
                  </a>
                </div>
                <div v-if="profile.github" class="up-meta-value">
                  <i class="pi pi-github" />
                  <a :href="'https://github.com/' + profile.github" target="_blank" rel="noopener noreferrer" class="up-author-link">
                    {{ profile.github }}
                  </a>
                </div>
              </section>

              <section class="up-sidebar-card">
                <div class="up-section-kicker">{{ t('community.detailLanguage') }}</div>
                <div class="up-meta-value">{{ profile.primaryLanguage || '-' }}</div>

                <div v-if="profile.createdAt" class="up-section-kicker up-subsection">{{ t('community.userProfile.joined') }}</div>
                <div v-if="profile.createdAt" class="up-meta-value">{{ formatDate(profile.createdAt) }}</div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import Skeleton from 'primevue/skeleton';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import PostCard from '../components/community/PostCard.vue';
import logoUrl from '../assets/logo.svg';
import { useCommunityStore } from '../stores/community';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/user';
import { getAvatarLabel } from '../utils/avatar';

const UP_STACKED_BREAKPOINT = 1180;

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const toast = useToast();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const userStore = useUserStore();

const followLoading = ref(false);
const postPage = ref(1);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);

const userId = computed(() => route.params.userId);
const profile = computed(() => communityStore.userProfile);
const displayUser = computed(() => userStore.profile || authStore.user || null);
const displayUserName = computed(() => displayUser.value?.nickname || displayUser.value?.email || t('app.name'));
const displayUserInitial = computed(() => getAvatarLabel(displayUserName.value));
const currentUserId = computed(() => authStore.user?.id ?? null);
const isSelf = computed(() => currentUserId.value && currentUserId.value === userId.value);
const avatarInitial = computed(() => getAvatarLabel(profile.value?.nickname || '?'));
const isStacked = computed(() => windowWidth.value <= UP_STACKED_BREAKPOINT);

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function handleResize() {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
}

function handleGoBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }

  router.push('/community');
}

function lockViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('workspace-locked');
  document.body.classList.add('workspace-locked');
}

function unlockViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('workspace-locked');
  document.body.classList.remove('workspace-locked');
}

async function loadData() {
  postPage.value = 1;
  await Promise.all([
    communityStore.fetchUserProfile(userId.value),
    communityStore.fetchUserPosts(userId.value, { page: 1 }),
  ]);
}

async function handleToggleFollow() {
  followLoading.value = true;
  try {
    await communityStore.toggleFollow(userId.value);
    await communityStore.fetchUserProfile(userId.value);
    toast.add({
      severity: 'success',
      summary: profile.value?.isFollowing ? t('community.followSuccess') : t('community.unfollowSuccess'),
      life: 2000,
    });
  } catch {
    // handled by global error
  } finally {
    followLoading.value = false;
  }
}

function handleOpenPost(postId) {
  router.push({ name: 'postDetail', params: { postId } });
}

async function handlePageChange(event) {
  const page = event.page + 1;
  postPage.value = page;
  await communityStore.fetchUserPosts(userId.value, { page });
}

watch(userId, () => {
  if (userId.value) loadData();
});

onMounted(() => {
  lockViewport();
  if (userId.value) loadData();
  if (authStore.isAuthenticated && !userStore.profile) {
    userStore.fetchProfile().catch(() => {});
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  unlockViewport();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* ── Shell ── */
.up-shell {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.up-shell > * {
  min-width: 0;
  min-height: 0;
}

.up-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

/* ── Topbar ── */
.up-topbar {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(280px, 1fr) minmax(300px, auto);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.up-brand,
.up-topbar-actions,
.up-control-group,
.up-author-row,
.up-author-shell,
.up-sidebar-author {
  display: flex;
  align-items: center;
}

.up-brand {
  gap: 0.7rem;
  min-width: 0;
}

.up-brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
}

.up-brand-copy,
.up-banner {
  min-width: 0;
}

.up-eyebrow,
.up-section-kicker,
.up-metric-label {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.up-page-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

.up-banner-copy,
.up-author-meta,
.up-author-bio,
.up-sidebar-author-copy span {
  margin: 0.2rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.up-banner-copy {
  font-size: 0.92rem;
}

.up-topbar-actions {
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.up-control-group {
  gap: 0.3rem;
  padding-right: 0.5rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--app-border);
}

/* ── Body Grid ── */
.up-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.up-body-stacked {
  flex-direction: column;
}

.up-nav-shell {
  flex: 0 0 270px;
  min-width: 270px;
  max-width: 320px;
  min-height: 0;
  border-right: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
}

.up-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
}

.up-main,
.up-content,
.up-nav-shell,
.up-nav,
.up-sidebar {
  min-width: 0;
  min-height: 0;
}

.up-nav,
.up-main {
  overflow: auto;
}

.up-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.up-sidebar {
  border-left: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
  overflow: auto;
}

.up-nav-section,
.up-nav-footer,
.up-sidebar-card {
  padding: 1rem;
}

.up-nav-section + .up-nav-section,
.up-nav-footer,
.up-sidebar-card + .up-sidebar-card {
  border-top: 1px solid var(--app-border);
}

.up-nav-header,
.up-nav-profile,
.up-nav-button,
.up-nav-main {
  display: flex;
}

.up-nav-header {
  flex-direction: column;
  gap: 0.3rem;
}

.up-nav-title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color);
}

.up-nav-caption {
  color: var(--text-color-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
}

.up-nav-list {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
}

.up-nav-button {
  width: 100%;
  align-items: center;
  gap: 0.78rem;
  padding: 0.72rem 0.8rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: var(--text-color-secondary);
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.up-nav-button:hover {
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-inset));
  color: var(--text-color);
}

.up-nav-button-primary {
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-raised));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  color: var(--text-color);
}

.up-nav-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
  color: var(--primary-color);
  flex-shrink: 0;
}

.up-nav-main {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.16rem;
}

.up-nav-label {
  font-size: 0.92rem;
  font-weight: 700;
  color: inherit;
}

.up-nav-description {
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.up-nav-profile {
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.85rem;
}

.up-nav-footer {
  margin-top: auto;
}

.up-nav-profile-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

.up-nav-profile-copy strong {
  color: var(--text-color);
  font-size: 0.96rem;
}

.up-nav-profile-copy span {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
  word-break: break-all;
}

/* ── Main Content ── */
.up-article {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1.1rem;
}

.up-author-row {
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.up-author-shell {
  gap: 0.85rem;
  min-width: 0;
  align-items: flex-start;
}

.up-avatar {
  flex-shrink: 0;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-subtle));
  color: var(--primary-color);
  border: 2px solid color-mix(in srgb, var(--primary-color) 14%, var(--app-border));
}

.up-author-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.up-author-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-color);
  line-height: 1.15;
}

.up-author-bio {
  font-size: 0.92rem;
}

.up-author-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  margin-top: 0.25rem;
}

.up-loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.up-loading-text {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.up-post-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.up-paginator {
  margin-top: 0.5rem;
}

.up-empty-state {
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  text-align: center;
}

.up-empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
  color: var(--primary-color);
  font-size: 1.4rem;
}

.up-empty-title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.up-skeleton-posts {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* ── Sidebar ── */
.up-sidebar-stack {
  display: flex;
  flex-direction: column;
}

.up-metrics {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.up-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.up-metric-label {
  color: var(--text-color-secondary);
}

.up-metric-value,
.up-meta-value {
  color: var(--text-color);
  font-weight: 700;
}

.up-meta-value {
  margin-top: 0.4rem;
  font-size: 0.95rem;
}

.up-sidebar-author {
  gap: 0.85rem;
  min-width: 0;
  margin-top: 0.75rem;
}

.up-sidebar-author-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.up-sidebar-author-copy strong {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.up-sidebar-author-copy span {
  font-size: 0.84rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.up-follow-btn {
  width: 100%;
  margin-top: 0.85rem;
}

.up-subsection {
  margin-top: 1rem;
}

.up-tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.up-tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--primary-color);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.up-author-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.84rem;
}

.up-author-link:hover {
  text-decoration: underline;
}

.up-sidebar-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: var(--text-color-secondary);
}

/* ── Responsive ── */
@media (max-width: 1180px) {
  .up-topbar {
    grid-template-columns: 1fr;
  }

  .up-nav-shell {
    flex-basis: auto;
    min-width: 100%;
    max-width: none;
    border-right: 0;
    border-bottom: 1px solid var(--app-border);
  }

  .up-content {
    grid-template-columns: 1fr;
  }

  .up-sidebar {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }
}

@media (max-width: 720px) {
  .up-topbar-actions {
    justify-content: space-between;
  }

  .up-topbar-actions :deep(.p-button-label) {
    display: none;
  }

  .up-author-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
