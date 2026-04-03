<template>
  <div class="community-shell animate-fade-in">
    <div class="community-frame">
      <header class="community-topbar animate-fade-in-up delay-100">
        <div class="community-brand-block">
          <div class="community-brand-icon">
            <img class="community-brand-logo" :src="logoUrl" :alt="t('app.logoAlt')" width="36" height="36">
          </div>

          <div class="community-brand-copy">
            <div class="community-eyebrow">{{ t('app.name') }}</div>
            <h1 class="community-title">{{ t('community.title') }}</h1>
          </div>
        </div>

        <section
          ref="communitySearchRef"
          class="community-command"
          :class="{ 'community-command-open': showCommunitySearchDropdown }"
          @focusin="handleCommunitySearchFocusIn"
          @focusout="handleCommunitySearchFocusOut"
        >
          <div class="community-command-field">
            <i class="pi pi-search community-command-icon" aria-hidden="true" />
            <InputText
              id="community-command-search"
              :model-value="communitySearchQuery"
              :placeholder="t('sidebar.searchPlaceholder')"
              class="community-command-input"
              @update:model-value="handleCommunitySearchInput"
              @keydown.down.prevent="handleCommunitySearchStep(1)"
              @keydown.up.prevent="handleCommunitySearchStep(-1)"
              @keydown.enter.prevent="handleCommunitySearchEnter"
              @keydown.esc.prevent="handleCommunitySearchEscape"
            />
            <span class="community-command-shortcut" aria-hidden="true">
              <kbd>Ctrl</kbd>
              <kbd>K</kbd>
            </span>
          </div>

          <div
            v-if="showCommunitySearchDropdown"
            class="community-command-results"
            role="listbox"
            :aria-label="t('common.search')"
          >
            <button
              v-for="(post, index) in communitySearchResults"
              :key="post.id"
              type="button"
              class="community-command-result"
              :class="{ 'community-command-result-active': index === communitySearchActiveIndex }"
              role="option"
              :aria-selected="index === communitySearchActiveIndex"
              @mousedown.prevent
              @mouseenter="communitySearchActiveIndex = index"
              @click="handleOpenCommunitySearchResult(post)"
            >
              <div class="community-command-result-main">
                <span class="community-command-result-title">{{ post.title || t('community.noPosts') }}</span>
                <span class="community-command-result-summary">{{ post.searchSummary }}</span>
              </div>
              <div class="community-command-result-meta">
                <span class="community-command-result-author">{{ post.authorLabel }}</span>
                <span class="community-command-result-language">{{ post.language || 'Markdown' }}</span>
              </div>
            </button>

            <div v-if="!communitySearchResults.length" class="community-command-empty">
              {{ t('workspace.searchNoResults') }}
            </div>
          </div>
        </section>

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
              icon="pi pi-home"
              :label="t('community.workspaceAction')"
              severity="secondary"
              outlined
              class="community-nav-btn"
              @click="router.push('/workspace')"
            />

            <Button
              icon="pi pi-cog"
              :label="t('sidebar.settings')"
              severity="secondary"
              outlined
              class="community-nav-btn"
              @click="router.push('/settings')"
            />
          </div>
        </div>
      </header>

      <div class="community-body animate-fade-in-up delay-150" :class="{ 'community-body-stacked': isCommunityStacked }">
        <aside class="community-sidebar-shell">
          <div class="community-sidebar">
            <section class="community-sidebar-section">
              <div class="community-sidebar-header">
                <h2 class="community-sidebar-title">{{ t('community.feed') }}</h2>
                <span class="community-sidebar-caption">{{ t('community.feedHint') }}</span>
              </div>

              <div class="community-scope-list">
                <button
                  v-for="scope in communityScopeButtons"
                  :key="scope.value"
                  type="button"
                  class="community-scope-button"
                  :class="{ 'community-scope-button-active': activeFeedScope === scope.value }"
                  @click="handleChangeScope(scope.value)"
                >
                  <span class="community-scope-icon"><i :class="scope.icon" /></span>
                  <span class="community-scope-main">
                    <span class="community-scope-label">{{ scope.label }}</span>
                  </span>
                </button>
              </div>
            </section>

            <div class="community-sidebar-footer">
              <div class="community-sidebar-user-main">
                <Avatar
                  v-if="displayUser?.avatar"
                  :image="displayUser.avatar"
                  shape="circle"
                  size="large"
                  class="community-sidebar-user-avatar"
                />
                <Avatar
                  v-else
                  :label="displayUserInitial"
                  shape="circle"
                  size="large"
                  class="community-sidebar-user-avatar"
                />

                <div class="community-sidebar-user-copy">
                  <div class="community-sidebar-user-name">{{ displayUserName }}</div>
                  <div class="community-sidebar-user-email">{{ displayUser?.email || '' }}</div>
                </div>
              </div>

              <div class="community-sidebar-user-actions">
                <Button
                  icon="pi pi-cog"
                  text
                  rounded
                  size="small"
                  :aria-label="t('sidebar.settings')"
                  :title="t('sidebar.settings')"
                  class="community-sidebar-user-action"
                  @click="router.push('/settings')"
                />
                <Button
                  icon="pi pi-sign-out"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  :aria-label="t('sidebar.logout')"
                  :title="t('sidebar.logout')"
                  class="community-sidebar-user-action"
                  @click="handleLogout"
                />
              </div>
            </div>
          </div>
        </aside>

        <div class="community-main">
          <section
            ref="communityFeedPanelRef"
            class="community-feed-panel"
            :class="{ 'community-feed-panel-expanded': !!expandedPost }"
          >
            <div
              v-if="expandedPost"
              class="community-inline-detail"
              :style="{ viewTransitionName: activeCardTransitionName }"
            >
              <div class="community-inline-detail-toolbar">
                <Button
                  icon="pi pi-arrow-left"
                  :label="t('community.backToCommunity')"
                  severity="secondary"
                  text
                  class="community-inline-detail-back"
                  @click="handleCloseExpandedPost"
                />

                <div class="community-inline-detail-toolbar-meta">
                  <span class="community-feed-badge">{{ formatCompactNumber(expandedPost.viewCount || 0) }} {{ t('community.views') }}</span>
                  <span class="community-feed-badge">{{ formatCompactNumber(expandedPost.likeCount || 0) }} {{ t('community.likes') }}</span>
                  <span class="community-feed-badge">{{ formatCompactNumber(expandedPost.collectCount || 0) }} {{ t('community.collects') }}</span>
                </div>
              </div>

              <div class="community-inline-detail-scroll">
                <div class="community-inline-detail-hero">
                  <div class="community-inline-detail-author community-author-link" @click="showUserCard($event, expandedPost.userId)">
                    <Avatar
                      v-if="expandedPost.authorAvatar"
                      :image="expandedPost.authorAvatar"
                      shape="circle"
                      size="large"
                    />
                    <Avatar
                      v-else
                      :label="expandedPostAuthorInitial"
                      shape="circle"
                      size="large"
                    />

                    <div class="community-inline-detail-author-copy">
                      <strong class="community-inline-detail-author-name">{{ expandedPost.authorNickname || t('common.unknown') }}</strong>
                      <span class="community-inline-detail-author-meta">{{ t('community.publishedAt') }} {{ expandedPostCreatedAt }}</span>
                    </div>
                  </div>

                  <Button
                    v-if="showExpandedFollowAction"
                    size="small"
                    class="community-inline-detail-follow"
                    :label="isExpandedFollowing ? t('community.following') : t('community.follow')"
                    :severity="isExpandedFollowing ? 'secondary' : undefined"
                    :outlined="!isExpandedFollowing"
                    :loading="followPendingUserId === expandedPost.userId"
                    @click="handleToggleSuggestedFollow(expandedPost.userId)"
                  />
                </div>

                <div class="community-section-kicker">{{ t('community.detailArticle') }}</div>
                <h2 class="community-inline-detail-title">{{ expandedPost.title || t('community.noPosts') }}</h2>

                <div v-if="expandedPost.language || expandedPost.tags?.length || expandedPost.originNoteId" class="community-inline-detail-tags">
                  <span v-if="expandedPost.language" class="community-inline-detail-chip community-inline-detail-chip-language">
                    {{ expandedPost.language }}
                  </span>
                  <span v-for="tag in (expandedPost.tags || [])" :key="tag" class="community-inline-detail-chip">
                    #{{ tag }}
                  </span>
                  <span v-if="expandedPost.originNoteId" class="community-inline-detail-chip">#{{ expandedPost.originNoteId }}</span>
                </div>

                <div class="community-inline-detail-article-shell">
                  <article
                    ref="expandedMarkdownContentRef"
                    class="community-inline-detail-content markdown-preview"
                    v-html="expandedRenderedContent"
                  />
                </div>

                <div class="community-inline-detail-footer">
                  <div class="community-inline-detail-actions">
                    <Button
                      :icon="expandedPostResolved && communityStore.currentPost?.liked ? 'pi pi-heart-fill' : 'pi pi-heart'"
                      :label="`${t('community.likes')} ${expandedPost.likeCount || 0}`"
                      :severity="expandedPostResolved && communityStore.currentPost?.liked ? 'danger' : 'secondary'"
                      :outlined="!(expandedPostResolved && communityStore.currentPost?.liked)"
                      :disabled="!expandedPostResolved"
                      @click="handleToggleExpandedLike"
                    />

                    <Button
                      :icon="expandedPostResolved && communityStore.currentPost?.collected ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                      :label="`${t('community.collects')} ${expandedPost.collectCount || 0}`"
                      :severity="expandedPostResolved && communityStore.currentPost?.collected ? 'contrast' : 'secondary'"
                      :outlined="!(expandedPostResolved && communityStore.currentPost?.collected)"
                      :disabled="!expandedPostResolved"
                      @click="handleToggleExpandedCollect"
                    />

                    <Button
                      icon="pi pi-share-alt"
                      :label="`${t('community.share')} ${expandedPost.shareCount || 0}`"
                      severity="secondary"
                      outlined
                      @click="shareDialogVisible = true"
                    />
                  </div>

                  <CommentSection
                    v-if="expandedPostId"
                    class="community-inline-detail-comments"
                    :post-id="expandedPostId"
                  />
                </div>
              </div>
            </div>

            <template v-else>
              <div class="community-feed-header">
                <div>
                  <h2 class="community-feed-title">{{ activeScopeTitle }}</h2>
                  <p class="community-feed-body">{{ activeScopeDescription }}</p>
                </div>

                <div class="community-feed-meta">
                  <span class="community-feed-badge">{{ visiblePostTotal }} {{ t('community.postsMetric') }}</span>
                  <span class="community-feed-badge">{{ topTags.length }} {{ t('community.hotTags') }}</span>
                </div>
              </div>

              <div v-if="bootstrapping && !visiblePosts.length" class="community-loading-state">
                <span class="community-loading-text">{{ t('common.loading') }}</span>
              </div>

              <div v-else-if="visiblePosts.length" class="community-post-list">
                <div
                  v-for="row in visiblePostRows"
                  :key="row.id"
                  class="community-post-row"
                  :class="`community-post-row-${row.columns}`"
                >
                  <PostCard
                    v-for="post in row.posts"
                    :key="post.id"
                    class="community-post-card"
                    :post="post"
                    :transition-name="String(post.id) === String(transitioningPostId || '') ? activeCardTransitionName : ''"
                    @click="handleOpenPost"
                  />
                </div>
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
                v-if="showCommunityPaginator"
                class="community-paginator"
                :first="(communityStore.page - 1) * communityStore.size"
                :rows="communityStore.size"
                :total-records="visiblePostTotal"
                @page="handlePageChange"
              />
            </template>
          </section>

          <aside class="community-insights-shell">
            <div class="community-insights">
              <section class="community-insight-card">
                <div class="community-section-kicker">{{ t('community.peopleToFollow') }}</div>
                <div v-if="suggestedAuthors.length" class="community-people-list">
                  <article v-for="person in suggestedAuthors" :key="person.userId" class="community-person-row">
                    <div class="community-person-main community-author-link" @click="showUserCard($event, person.userId)">
                      <Avatar
                        v-if="person.authorAvatar"
                        :image="person.authorAvatar"
                        shape="circle"
                      />
                      <Avatar
                        v-else
                        :label="person.initial"
                        shape="circle"
                      />

                      <div class="community-person-copy">
                        <strong class="community-person-name">{{ person.authorNickname || t('common.unknown') }}</strong>
                        <span class="community-person-meta">
                          {{ person.postCount }} {{ t('community.postsMetric') }}
                          <template v-if="person.primaryLanguage"> · {{ person.primaryLanguage }}</template>
                        </span>
                      </div>
                    </div>

                    <Button
                      size="small"
                      class="community-person-follow"
                      :label="person.isFollowing ? t('community.following') : t('community.follow')"
                      :severity="person.isFollowing ? 'secondary' : undefined"
                      :outlined="!person.isFollowing"
                      :loading="followPendingUserId === person.userId"
                      @click="handleToggleSuggestedFollow(person.userId)"
                    />
                  </article>
                </div>
                <p v-else class="community-empty-copy">{{ t('community.noPeopleToFollow') }}</p>
              </section>

              <section class="community-insight-card">
                <div class="community-section-kicker">{{ t('community.growthRanking') }}</div>
                <div v-if="growthRankingPosts.length" class="community-ranking-list">
                  <button
                    v-for="(post, index) in growthRankingPosts"
                    :key="`growth-${post.id}`"
                    type="button"
                    class="community-ranking-row"
                    @click="handleOpenPost(post.id)"
                  >
                    <span class="community-ranking-index">{{ String(index + 1).padStart(2, '0') }}</span>

                    <div class="community-ranking-copy">
                      <strong class="community-ranking-title">{{ post.title || t('community.noPosts') }}</strong>
                      <span class="community-ranking-meta">{{ post.authorNickname || t('common.unknown') }}</span>
                      <div class="community-ranking-stats">
                        <span><i class="pi pi-bolt" /> {{ formatCompactNumber(post.growthScore) }}</span>
                        <span><i class="pi pi-heart" /> {{ formatCompactNumber(post.likeCount || 0) }}</span>
                        <span><i class="pi pi-eye" /> {{ formatCompactNumber(post.viewCount || 0) }}</span>
                      </div>
                    </div>
                  </button>
                </div>
                <p v-else class="community-empty-copy">{{ t('community.noGrowthPosts') }}</p>
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

    <PostShareDialog v-model:visible="shareDialogVisible" :post-id="expandedPostId" />
    <UserHoverCard ref="communityUserHoverCardRef" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Textarea from 'primevue/textarea';
import LangToggle from '../components/common/LangToggle.vue';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import PostCard from '../components/community/PostCard.vue';
import UserHoverCard from '../components/community/UserHoverCard.vue';
import CommentSection from '../components/community/CommentSection.vue';
import PostShareDialog from '../components/community/PostShareDialog.vue';
import logoUrl from '../assets/logo.svg';
import { useAuthStore } from '../stores/auth';
import { useCommunityStore } from '../stores/community';
import { useUserStore } from '../stores/user';
import { getAvatarLabel } from '../utils/avatar';
import { bindMarkdownCodeActions, renderMarkdown } from '../utils/markdown';

const COMMUNITY_STACKED_BREAKPOINT = 1160;
const COMMUNITY_FEED_SINGLE_BREAKPOINT = 760;
const COMMUNITY_FEED_MIXED_BREAKPOINT = 1320;

const router = useRouter();
const { locale, t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const userStore = useUserStore();

const bootstrapping = ref(true);
const composerVisible = ref(false);
const publishing = ref(false);
const activeFeedScope = ref('recommend');
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1360);
const communityFeedPanelRef = ref(null);
const communitySearchQuery = ref('');
const communitySearchRef = ref(null);
const communitySearchFocused = ref(false);
const communitySearchActiveIndex = ref(-1);
const expandedMarkdownContentRef = ref(null);
const publicFeedSnapshot = ref([]);
const followPendingUserId = ref(null);
const expandedPostId = ref(null);
const expandedPostSeed = ref(null);
const shareDialogVisible = ref(false);
const communityUserHoverCardRef = ref(null);
const transitioningPostId = ref(null);
let teardownExpandedMarkdownCodeActions = null;
const composer = reactive({
  title: '',
  content: '',
  language: '',
  tags: '',
  originNoteId: '',
});

const displayUser = computed(() => userStore.profile || authStore.user || null);
const currentUserId = computed(() => displayUser.value?.id ?? authStore.user?.id ?? null);
const displayUserName = computed(() => displayUser.value?.nickname || displayUser.value?.email || t('app.name'));
const displayUserInitial = computed(() => getAvatarLabel(displayUserName.value));
const isCommunityStacked = computed(() => windowWidth.value <= COMMUNITY_STACKED_BREAKPOINT);
const communityScopeButtons = computed(() => ([
  {
    value: 'recommend',
    icon: 'pi pi-sparkles',
    label: t('community.recommend'),
    description: t('community.scopeRecommendDescription'),
  },
  {
    value: 'latest',
    icon: 'pi pi-clock',
    label: t('community.latest'),
    description: t('community.scopeLatestDescription'),
  },
  {
    value: 'hot',
    icon: 'pi pi-bolt',
    label: t('community.hot'),
    description: t('community.scopeHotDescription'),
  },
  {
    value: 'following',
    icon: 'pi pi-heart',
    label: t('community.followingFeed'),
    description: t('community.scopeFollowingDescription'),
  },
  {
    value: 'mine',
    icon: 'pi pi-user',
    label: t('community.mineAction'),
    description: t('community.scopeMineDescription'),
  },
]));
const activeScopeMeta = computed(() => (
  communityScopeButtons.value.find((scope) => scope.value === activeFeedScope.value) || communityScopeButtons.value[0]
));
const activeScopeTitle = computed(() => activeScopeMeta.value?.label || t('community.recommend'));
const activeScopeDescription = computed(() => activeScopeMeta.value?.description || t('community.scopeRecommendDescription'));
const visiblePosts = computed(() => buildVisiblePosts(activeFeedScope.value, communityStore.posts));
const communityFeedLayout = computed(() => {
  if (windowWidth.value <= COMMUNITY_FEED_SINGLE_BREAKPOINT) {
    return 'single';
  }

  if (isCommunityStacked.value) {
    return windowWidth.value >= 1040 ? 'mixed' : 'double';
  }

  return windowWidth.value >= COMMUNITY_FEED_MIXED_BREAKPOINT ? 'mixed' : 'double';
});
const visiblePostRows = computed(() => buildVisiblePostRows(visiblePosts.value, communityFeedLayout.value));
const activeCardTransitionName = 'community-active-post';
const insightSourcePosts = computed(() => {
  if (publicFeedSnapshot.value.length) {
    return publicFeedSnapshot.value;
  }

  return activeFeedScope.value === 'mine' ? [] : communityStore.posts;
});
const visiblePostTotal = computed(() => {
  if (activeFeedScope.value === 'following') {
    return visiblePosts.value.length;
  }

  return communityStore.total || visiblePosts.value.length;
});
const showCommunityPaginator = computed(() => (
  activeFeedScope.value !== 'following' && visiblePostTotal.value > 0
));
const communitySearchResults = computed(() => {
  const query = String(communitySearchQuery.value || '').trim().toLowerCase();

  if (!query) {
    return [];
  }

  return visiblePosts.value
    .filter((post) => {
      const title = String(post.title || '').toLowerCase();
      const summary = summarizePostContent(post.content).toLowerCase();
      const language = String(post.language || '').toLowerCase();
      const tags = (post.tags || []).map((tag) => String(tag || '').trim().toLowerCase()).join(' ');
      const author = String(post.authorNickname || '').toLowerCase();

      return [title, summary, language, tags, author].some((value) => value.includes(query));
    })
    .map((post) => {
      const title = String(post.title || '').toLowerCase();
      const summary = summarizePostContent(post.content).toLowerCase();
      const language = String(post.language || '').toLowerCase();
      const tags = (post.tags || []).map((tag) => String(tag || '').trim().toLowerCase()).join(' ');
      let rank = 5;

      if (title === query) rank = 0;
      else if (title.startsWith(query)) rank = 1;
      else if (title.includes(query)) rank = 2;
      else if (summary.includes(query)) rank = 3;
      else if (tags.includes(query)) rank = 4;

      return {
        ...post,
        rank,
        authorLabel: post.authorNickname || t('common.unknown'),
        searchSummary: summarizePostContent(post.content) || t('community.excerptFallback'),
        language: post.language || 'Markdown',
      };
    })
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    })
    .slice(0, 7);
});
const showCommunitySearchDropdown = computed(() => (
  communitySearchFocused.value && String(communitySearchQuery.value || '').trim().length > 0
));
const suggestedAuthors = computed(() => {
  if (communityStore.recommendedUsers.length) {
    return communityStore.recommendedUsers.map((u) => ({
      userId: u.userId,
      authorNickname: u.nickname || '',
      authorAvatar: u.avatar || '',
      postCount: u.postCount || 0,
      primaryLanguage: u.primaryLanguage || '',
      initial: getAvatarLabel(u.nickname || '?'),
      isFollowing: communityStore.isFollowing(u.userId),
    }));
  }
  return buildAuthorSuggestions(insightSourcePosts.value, {
    currentUserId: currentUserId.value,
    followingIds: communityStore.followingIds,
  });
});
const growthRankingPosts = computed(() => {
  if (communityStore.hotPosts.length) {
    return communityStore.hotPosts.slice(0, 5).map((post) => ({
      ...post,
      growthScore: growthScore(post),
    }));
  }
  return buildGrowthRanking(insightSourcePosts.value);
});
const topTags = computed(() => summarizeCollection(visiblePosts.value, (post) => post.tags || []));
const topLanguages = computed(() => summarizeCollection(visiblePosts.value, (post) => [post.language].filter(Boolean)));
const expandedPost = computed(() => {
  if (!expandedPostId.value) {
    return null;
  }

  if (communityStore.currentPost && String(communityStore.currentPost.id) === String(expandedPostId.value)) {
    return communityStore.currentPost;
  }

  if (expandedPostSeed.value && String(expandedPostSeed.value.id) === String(expandedPostId.value)) {
    return expandedPostSeed.value;
  }

  return findKnownPost(expandedPostId.value);
});
const expandedPostResolved = computed(() => (
  Boolean(expandedPostId.value)
  && Boolean(communityStore.currentPost)
  && String(communityStore.currentPost.id) === String(expandedPostId.value)
));
const expandedPostAuthorInitial = computed(() => getAvatarLabel(expandedPost.value?.authorNickname || '?'));
const expandedPostCreatedAt = computed(() => formatAbsoluteTime(expandedPost.value?.createdAt));
const expandedRenderedContent = computed(() => renderMarkdown(expandedPost.value?.content || '', {
  enhancedCodeBlocks: true,
  copyButtonLabel: t('common.copy'),
  defaultCodeLanguageLabel: t('common.plainText'),
}));
const showExpandedFollowAction = computed(() => (
  Boolean(expandedPost.value?.userId) && String(expandedPost.value.userId) !== String(currentUserId.value)
));
const isExpandedFollowing = computed(() => (
  Boolean(expandedPost.value?.userId) && communityStore.isFollowing(expandedPost.value.userId)
));
const communityMetrics = computed(() => ([
  { id: 'posts', label: t('community.postsMetric'), value: visiblePostTotal.value },
  { id: 'following', label: t('community.following'), value: communityStore.followingIds.length },
  { id: 'languages', label: t('community.languagesMetric'), value: topLanguages.value.length },
]));
const emptyStateTitle = computed(() => {
  if (activeFeedScope.value === 'mine') {
    return t('community.noOwnPosts');
  }

  if (activeFeedScope.value === 'following') {
    return t('community.noFollowingPosts');
  }

  return t('community.noPosts');
});
const emptyStateBody = computed(() => {
  if (activeFeedScope.value === 'mine') {
    return t('community.noOwnPostsDescription');
  }

  if (activeFeedScope.value === 'following') {
    return t('community.noFollowingPostsDescription');
  }

  return t('community.noPostsDescription');
});

function showError(error, fallbackMessage) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error?.message || fallbackMessage,
    life: 3200,
  });
}

function cleanupExpandedMarkdownCodeActions() {
  if (typeof teardownExpandedMarkdownCodeActions === 'function') {
    teardownExpandedMarkdownCodeActions();
    teardownExpandedMarkdownCodeActions = null;
  }
}

function setupExpandedMarkdownCodeActions() {
  cleanupExpandedMarkdownCodeActions();

  if (!expandedMarkdownContentRef.value) {
    return;
  }

  teardownExpandedMarkdownCodeActions = bindMarkdownCodeActions(expandedMarkdownContentRef.value, {
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

function engagementScore(post = {}) {
  return Number(post.likeCount || 0) * 5 + Number(post.collectCount || 0) * 6 + Number(post.viewCount || 0) * 1.4;
}

function postCreatedTime(post = {}) {
  return new Date(post.createdAt || 0).getTime() || 0;
}

function comparePostsByNewest(left, right) {
  return postCreatedTime(right) - postCreatedTime(left);
}

function recommendationScore(post = {}) {
  const ageInMs = Math.max(0, Date.now() - postCreatedTime(post));
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
  const freshnessBoost = Math.max(0, 14 - ageInDays) * 2;
  return scorePost(post) + freshnessBoost;
}

function growthScore(post = {}) {
  const ageInHours = Math.max(1, (Date.now() - postCreatedTime(post)) / (1000 * 60 * 60));
  const freshnessFactor = 1 + Math.max(0, 120 - ageInHours) / 120;
  return Math.round((engagementScore(post) + Number(post.viewCount || 0) * 0.6) * freshnessFactor);
}

function buildVisiblePosts(scope, posts = []) {
  const source = [...posts];

  if (scope === 'mine') {
    return source.sort(comparePostsByNewest);
  }

  if (scope === 'latest') {
    return source.sort(comparePostsByNewest);
  }

  if (scope === 'hot') {
    return source.sort((left, right) => scorePost(right) - scorePost(left) || comparePostsByNewest(left, right));
  }

  if (scope === 'following') {
    return source
      .filter((post) => Boolean(post.userId) && communityStore.isFollowing(post.userId))
      .sort(comparePostsByNewest);
  }

  return source.sort((left, right) => recommendationScore(right) - recommendationScore(left) || comparePostsByNewest(left, right));
}

function buildVisiblePostRows(posts = [], layout = 'mixed') {
  if (!posts.length) {
    return [];
  }

  const pattern = layout === 'single' ? [1] : [2];
  const rawRows = [];
  let postIndex = 0;
  let patternIndex = 0;

  while (postIndex < posts.length) {
    const remaining = posts.length - postIndex;
    const targetSize = Math.min(pattern[patternIndex % pattern.length], remaining);
    rawRows.push([...posts.slice(postIndex, postIndex + targetSize)]);
    postIndex += targetSize;
    patternIndex += 1;
  }

  return rawRows.map((rowPosts, rowIndex) => ({
    id: `feed-row-${rowIndex}-${rowPosts.map((post) => post.id).join('-')}`,
    columns: rowPosts.length,
    posts: rowPosts,
  }));
}

function summarizePostContent(content = '') {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/[#>*`_\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function buildAuthorSuggestions(posts = [], options = {}) {
  const { currentUserId: activeUserId = null, followingIds = [] } = options;
  const followingSet = new Set(followingIds);
  const authorMap = new Map();

  posts.forEach((post) => {
    if (!post?.userId || post.userId === activeUserId) {
      return;
    }

    const existing = authorMap.get(post.userId) || {
      userId: post.userId,
      authorNickname: post.authorNickname || '',
      authorAvatar: post.authorAvatar || '',
      postCount: 0,
      primaryLanguage: '',
      languageCounts: new Map(),
      score: 0,
      latestAt: 0,
    };

    existing.postCount += 1;
    existing.score += engagementScore(post) + recommendationScore(post);
    existing.latestAt = Math.max(existing.latestAt, postCreatedTime(post));

    if (!existing.authorNickname && post.authorNickname) {
      existing.authorNickname = post.authorNickname;
    }

    if (!existing.authorAvatar && post.authorAvatar) {
      existing.authorAvatar = post.authorAvatar;
    }

    if (post.language) {
      const nextCount = (existing.languageCounts.get(post.language) || 0) + 1;
      existing.languageCounts.set(post.language, nextCount);

      if (!existing.primaryLanguage || nextCount > (existing.languageCounts.get(existing.primaryLanguage) || 0)) {
        existing.primaryLanguage = post.language;
      }
    }

    authorMap.set(post.userId, existing);
  });

  return [...authorMap.values()]
    .map((author) => {
      const recentBoost = Math.max(0, 72 - (Date.now() - author.latestAt) / (1000 * 60 * 60)) * 4;
      return {
        ...author,
        initial: getAvatarLabel(author.authorNickname || '?'),
        isFollowing: followingSet.has(author.userId),
        momentum: author.score + recentBoost,
      };
    })
    .sort((left, right) => Number(left.isFollowing) - Number(right.isFollowing) || right.momentum - left.momentum || right.postCount - left.postCount)
    .slice(0, 5);
}

function buildGrowthRanking(posts = []) {
  return [...posts]
    .map((post) => ({
      ...post,
      growthScore: growthScore(post),
    }))
    .sort((left, right) => right.growthScore - left.growthScore || scorePost(right) - scorePost(left) || comparePostsByNewest(left, right))
    .slice(0, 5);
}

function summarizeCollection(posts, extractor) {
  const counter = new Map();

  posts.forEach((post) => {
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

function findKnownPost(postId) {
  const targetId = String(postId || '');
  const source = [
    ...visiblePosts.value,
    ...insightSourcePosts.value,
    ...communityStore.posts,
  ];

  return source.find((post) => String(post?.id || '') === targetId) || null;
}

function handleResize() {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
}

function handleCommunitySearchInput(value) {
  communitySearchQuery.value = value;
  communitySearchFocused.value = true;
  communitySearchActiveIndex.value = String(value || '').trim() ? 0 : -1;
}

function handleCommunitySearchFocusIn() {
  communitySearchFocused.value = true;
}

function handleCommunitySearchFocusOut(event) {
  const nextFocusedElement = event.relatedTarget;

  if (nextFocusedElement instanceof Node && communitySearchRef.value?.contains(nextFocusedElement)) {
    return;
  }

  communitySearchFocused.value = false;
  communitySearchActiveIndex.value = -1;
}

function handleCommunitySearchStep(direction) {
  if (!showCommunitySearchDropdown.value || !communitySearchResults.value.length) {
    return;
  }

  const nextIndex = communitySearchActiveIndex.value + direction;
  const resultsCount = communitySearchResults.value.length;
  communitySearchActiveIndex.value = (nextIndex + resultsCount) % resultsCount;
}

function handleCommunitySearchEscape() {
  communitySearchFocused.value = false;
  communitySearchActiveIndex.value = -1;
}

function handleOpenCommunitySearchResult(post) {
  if (!post?.id) {
    return;
  }

  communitySearchFocused.value = false;
  communitySearchActiveIndex.value = -1;
  handleOpenPost(post.id);
}

function handleCommunitySearchEnter() {
  if (!showCommunitySearchDropdown.value || !communitySearchResults.value.length) {
    return;
  }

  const targetPost = communitySearchResults.value[Math.max(communitySearchActiveIndex.value, 0)];

  if (targetPost) {
    handleOpenCommunitySearchResult(targetPost);
  }
}

async function loadActiveScope(options = {}) {
  if (activeFeedScope.value === 'mine') {
    if (!currentUserId.value) {
      communityStore.posts = [];
      communityStore.total = 0;
      communityStore.page = options.page ?? 1;
      return [];
    }

    return communityStore.fetchUserPosts(currentUserId.value, options);
  }

  if (activeFeedScope.value === 'hot') {
    const response = await communityStore.fetchHotPosts(options);
    communityStore.posts = communityStore.hotPosts;
    communityStore.total = communityStore.hotPosts.length;
    return response;
  }

  const response = await communityStore.fetchPosts(options);
  publicFeedSnapshot.value = [...communityStore.posts];
  return response;
}

async function runCardTransition(postId, update) {
  transitioningPostId.value = postId;
  await nextTick();

  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    const transition = document.startViewTransition(async () => {
      update();
      await nextTick();
    });

    try {
      await transition.finished;
    } catch {
      // Ignore aborted transitions and fall back to final state.
    }
  } else {
    update();
    await nextTick();
  }

  if (!expandedPostId.value) {
    transitioningPostId.value = null;
  }
}

async function loadExpandedPost(postId) {
  if (!postId) {
    return;
  }

  if (expandedPostResolved.value && String(communityStore.currentPost?.id || '') === String(postId)) {
    return;
  }

  try {
    await communityStore.fetchPost(postId);
  } catch (error) {
    showError(error, t('community.loadFailed'));
  }
}

async function bootstrapCommunity() {
  bootstrapping.value = true;

  const results = await Promise.allSettled([
    loadActiveScope(),
    communityStore.fetchFollowing(),
    userStore.fetchProfile(),
    communityStore.fetchRecommendedUsers(5),
    communityStore.fetchHotPosts({ page: 1, size: 10 }),
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

  const previousScope = activeFeedScope.value;
  activeFeedScope.value = scope;
  expandedPostId.value = null;
  expandedPostSeed.value = null;
  transitioningPostId.value = null;

  const needsReload = (previousScope === 'mine') !== (scope === 'mine')
    || scope === 'hot'
    || previousScope === 'hot';

  if (needsReload) {
    try {
      await loadActiveScope({ page: 1, size: communityStore.size });
    } catch (error) {
      showError(error, t('community.loadFailed'));
    }
  }
}

function showUserCard(event, userId) {
  if (userId) {
    communityUserHoverCardRef.value?.show(event, userId);
  }
}

async function handleOpenPost(postId) {
  if (!postId || String(expandedPostId.value || '') === String(postId)) {
    return;
  }

  expandedPostSeed.value = findKnownPost(postId);
  await runCardTransition(postId, () => {
    expandedPostId.value = postId;
    if (communityFeedPanelRef.value) {
      communityFeedPanelRef.value.scrollTop = 0;
    }
  });
  await loadExpandedPost(postId);
}

async function handleCloseExpandedPost() {
  if (!expandedPostId.value) {
    return;
  }

  const closingPostId = expandedPostId.value;
  await runCardTransition(closingPostId, () => {
    expandedPostId.value = null;
    expandedPostSeed.value = null;
  });
}

function formatAbsoluteTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatCompactNumber(value) {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    notation: numericValue >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(numericValue);
}

async function handleToggleSuggestedFollow(userId) {
  if (!userId) {
    return;
  }

  if (userId === currentUserId.value) {
    showError(null, t('community.followSelf'));
    return;
  }

  const wasFollowing = communityStore.isFollowing(userId);
  followPendingUserId.value = userId;

  try {
    await communityStore.toggleFollow(userId);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: wasFollowing ? t('community.unfollowSuccess') : t('community.followSuccess'),
      life: 2200,
    });
  } catch (error) {
    showError(error, t('common.error'));
  } finally {
    if (followPendingUserId.value === userId) {
      followPendingUserId.value = null;
    }
  }
}

async function handleToggleExpandedLike() {
  if (!expandedPostId.value || !expandedPostResolved.value) {
    return;
  }

  try {
    await communityStore.toggleLike(expandedPostId.value);
  } catch (error) {
    showError(error, t('common.error'));
  }
}

async function handleToggleExpandedCollect() {
  if (!expandedPostId.value || !expandedPostResolved.value) {
    return;
  }

  try {
    await communityStore.toggleCollect(expandedPostId.value);
  } catch (error) {
    showError(error, t('common.error'));
  }
}


async function handleLogout() {
  await authStore.logout();
  await router.push('/');
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
  cleanupExpandedMarkdownCodeActions();
  unlockCommunityViewport();
  window.removeEventListener('resize', handleResize);
});

watch(
  () => communitySearchResults.value.length,
  (resultCount) => {
    if (!resultCount) {
      communitySearchActiveIndex.value = -1;
      return;
    }

    if (communitySearchActiveIndex.value < 0 || communitySearchActiveIndex.value >= resultCount) {
      communitySearchActiveIndex.value = 0;
    }
  },
);

watch(
  [() => expandedPostId.value, expandedRenderedContent, () => locale.value],
  async () => {
    await nextTick();
    setupExpandedMarkdownCodeActions();
  },
  { flush: 'post' },
);
</script>

<style scoped>
.community-author-link {
  cursor: pointer;
  border-radius: 0.5rem;
  transition: opacity 160ms ease;
}

.community-author-link:hover {
  opacity: 0.82;
}

.community-author-link:hover .community-inline-detail-author-name,
.community-author-link:hover .community-person-name {
  color: var(--primary-color);
}

.community-shell {
  --community-ink-strong: color-mix(in srgb, var(--text-color) 94%, #020617 6%);
  --community-ink-title: color-mix(in srgb, var(--text-color) 88%, #020617 12%);
  --community-ink-body: color-mix(in srgb, var(--text-color) 68%, var(--text-color-secondary) 32%);
  --community-ink-soft: color-mix(in srgb, var(--text-color-secondary) 82%, var(--text-color) 18%);
  --community-ink-faint: color-mix(in srgb, var(--text-color-secondary) 92%, var(--app-panel-raised) 8%);
  --community-ink-accent: color-mix(in srgb, var(--primary-color) 74%, var(--community-ink-soft));
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
  position: relative;
  z-index: 18;
  overflow: visible;
  isolation: isolate;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(280px, 1fr) minmax(360px, auto);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
}

.community-brand-block,
.community-command-shortcut,
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
  display: grid;
  place-items: center;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  flex-shrink: 0;
  overflow: hidden;
}

.community-brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-brand-copy,
.community-command {
  min-width: 0;
}

.community-eyebrow,
.community-section-kicker,
.community-sidebar-metric-label,
.community-summary-label,
.community-feed-badge,
.community-sidebar-caption {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.1em;
}

.community-eyebrow,
.community-section-kicker {
  color: var(--community-ink-accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 700;
}

.community-title,
.community-feed-title,
.community-sidebar-title {
  margin: 0;
  letter-spacing: -0.04em;
  color: var(--community-ink-strong);
}

.community-title {
  font-family: var(--font-display);
  font-size: clamp(1.32rem, 1.18rem + 0.36vw, 1.56rem);
  font-weight: 780;
  line-height: 1.02;
}

.community-command {
  position: relative;
  z-index: 2;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
  transition: border-color 180ms ease, background-color 180ms ease;
}

.community-command:focus-within,
.community-command-open {
  z-index: 40;
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
}

.community-command-field,
.community-command-result,
.community-command-result-main,
.community-command-result-meta {
  display: flex;
}

.community-command-field {
  min-height: 2.55rem;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.8rem;
}

.community-command-icon {
  color: var(--primary-color);
}

.community-command-input {
  flex: 1;
  min-width: 0;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.community-command-input::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 88%, transparent);
}

.community-command-shortcut {
  gap: 0.25rem;
  flex-shrink: 0;
}

.community-command-shortcut kbd {
  min-width: 1.85rem;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  text-align: center;
}

.community-command-results {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 80;
  display: grid;
  gap: 0;
  padding: 0.35rem 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 16%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised) 99%, transparent);
  box-shadow: var(--app-shadow-soft);
}

.community-command-result {
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0.85rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease;
}

.community-command-result:hover,
.community-command-result-active {
  background: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.community-command-result-main {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
}

.community-command-result-title {
  font-size: 0.92rem;
  font-weight: 720;
  color: var(--community-ink-strong);
  line-height: 1.28;
  letter-spacing: -0.01em;
}

.community-command-result-summary {
  color: var(--community-ink-soft);
  font-size: 0.79rem;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.community-command-result-meta {
  flex-shrink: 0;
  align-items: center;
  gap: 0.4rem;
  color: var(--community-ink-faint);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.community-command-result-author,
.community-command-result-language {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0 0.45rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 92%, transparent);
  background: color-mix(in srgb, var(--app-panel-inset) 94%, transparent);
}

.community-command-empty {
  padding: 0.9rem 0.85rem;
  color: var(--community-ink-soft);
  font-size: 0.84rem;
}

.community-scope-copy,
.community-feed-body,
.community-sidebar-copy,
.community-empty-body,
.community-empty-copy {
  margin: 0.2rem 0 0;
  color: var(--community-ink-body);
  font-size: 0.91rem;
  line-height: 1.7;
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
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-inset) 88%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.community-summary-value,
.community-sidebar-metric-value {
  font-size: 1rem;
  font-weight: 780;
  color: var(--community-ink-strong);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.community-summary-label,
.community-sidebar-metric-label,
.community-sidebar-caption {
  color: var(--community-ink-faint);
}

.community-feed-badge {
  color: var(--community-ink-soft);
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

.community-nav-btn {
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
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
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

.community-scope-list {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.8rem;
}

.community-sidebar-title {
  font-size: 0.98rem;
  font-weight: 720;
  line-height: 1.2;
}

.community-scope-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.58rem 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-color-secondary);
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.community-scope-button:hover {
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-inset));
  color: var(--text-color);
}

.community-scope-button-active {
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-raised));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  color: var(--text-color);
}

.community-scope-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.05rem;
  color: inherit;
}

.community-scope-main {
  min-width: 0;
  display: flex;
  align-items: center;
}

.community-scope-label {
  font-weight: 680;
  color: inherit;
  font-size: 0.88rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.community-sidebar-footer,
.community-sidebar-user-main,
.community-sidebar-user-actions {
  display: flex;
  align-items: center;
}

.community-sidebar-footer {
  margin-top: auto;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
}

.community-sidebar-user-main {
  min-width: 0;
  flex: 1;
  gap: 0.75rem;
}

.community-sidebar-user-avatar {
  width: 3rem;
  height: 3rem;
  min-width: 3rem;
  min-height: 3rem;
  flex: 0 0 3rem;
  flex-shrink: 0;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  overflow: hidden;
}

.community-sidebar-user-avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-sidebar-user-copy {
  min-width: 0;
}

.community-sidebar-user-name {
  font-size: 0.96rem;
  font-weight: 760;
  color: var(--community-ink-strong);
  letter-spacing: -0.01em;
}

.community-sidebar-user-email {
  color: var(--community-ink-soft);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.community-sidebar-user-actions {
  gap: 0.25rem;
  flex-shrink: 0;
}

.community-sidebar-user-action {
  width: 2.25rem;
  height: 2.25rem;
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

.community-feed-panel-expanded {
  overflow: hidden;
}

.community-inline-detail,
.community-inline-detail-scroll,
.community-inline-detail-toolbar,
.community-inline-detail-toolbar-meta,
.community-inline-detail-hero,
.community-inline-detail-author,
.community-inline-detail-author-copy,
.community-inline-detail-tags,
.community-inline-detail-actions {
  display: flex;
}

.community-inline-detail {
  height: 100%;
  min-height: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--app-panel-raised) 99%, transparent);
  border-radius: 1.1rem;
  box-shadow: var(--app-shadow-soft);
}

.community-inline-detail-scroll {
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1.1rem;
  overflow: auto;
  padding: 1.1rem 0 0.4rem;
}

.community-inline-detail-toolbar,
.community-inline-detail-hero {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.community-inline-detail-toolbar {
  padding-top: 0.85rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--app-border);
  flex-shrink: 0;
}

.community-inline-detail-toolbar-meta,
.community-inline-detail-tags,
.community-inline-detail-actions {
  flex-wrap: wrap;
  gap: 0.55rem;
}

.community-inline-detail-author {
  min-width: 0;
  align-items: center;
  gap: 0.85rem;
}

.community-inline-detail-author-copy {
  min-width: 0;
  flex-direction: column;
  gap: 0.14rem;
}

.community-inline-detail-author-name,
.community-inline-detail-title {
  color: var(--community-ink-strong);
}

.community-inline-detail-author-name {
  font-size: 0.96rem;
  font-weight: 750;
  letter-spacing: -0.01em;
}

.community-inline-detail-author-meta {
  color: var(--community-ink-soft);
  font-size: 0.78rem;
}

.community-inline-detail-title {
  margin: 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.84rem, 1.56rem + 0.86vw, 2.08rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.05em;
}

.community-inline-detail-article-shell {
  padding-bottom: 0.25rem;
}

.community-inline-detail-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.72rem;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.community-inline-detail-chip-language {
  border-color: color-mix(in srgb, var(--primary-color) 22%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--primary-color);
}

.community-inline-detail-content {
  min-height: 0;
  color: var(--text-color);
  line-height: 1.78;
}

.community-inline-detail-content :deep(:last-child) {
  margin-bottom: 0;
}

.community-inline-detail-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--app-border);
  clear: both;
}

.community-inline-detail-actions {
  padding-top: 0;
}

.community-inline-detail-comments {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.community-feed-header {
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--app-border);
  flex-wrap: wrap;
}

.community-feed-title {
  font-family: var(--font-display, var(--font-sans));
  margin-top: 0;
  font-size: clamp(1.3rem, 1.18rem + 0.4vw, 1.5rem);
  font-weight: 780;
  line-height: 1.08;
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
  background: color-mix(in srgb, var(--app-panel-inset) 95%, transparent);
  font-weight: 650;
}

.community-post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
}

.community-post-row {
  display: grid;
  gap: 1rem;
  align-items: stretch;
}

.community-post-row-1 {
  grid-template-columns: minmax(0, 1fr);
}

.community-post-row-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.community-post-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.community-post-card {
  min-width: 0;
  height: 100%;
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
  color: var(--community-ink-soft);
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
  font-family: var(--font-display, var(--font-sans));
  font-size: 1.2rem;
  font-weight: 780;
  letter-spacing: -0.04em;
  color: var(--community-ink-strong);
}

.community-paginator {
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--app-border);
}

.community-insights-shell {
  border-left: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
}

.community-insights {
  display: flex;
  flex-direction: column;
}

.community-people-list,
.community-ranking-list {
  display: grid;
  margin-top: 0.85rem;
  gap: 0.75rem;
}

.community-person-row,
.community-person-main,
.community-person-copy,
.community-ranking-copy,
.community-ranking-stats {
  display: flex;
}

.community-person-row {
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
  box-shadow: var(--app-shadow-soft);
}

.community-person-main {
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
}

.community-person-copy,
.community-ranking-copy {
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
}

.community-person-name,
.community-ranking-title {
  color: var(--community-ink-strong);
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.community-person-name {
  font-size: 0.93rem;
  font-weight: 720;
}

.community-person-meta,
.community-ranking-meta,
.community-ranking-stats {
  color: var(--community-ink-soft);
  font-size: 0.76rem;
}

.community-ranking-title {
  font-size: 0.92rem;
  font-weight: 720;
}

.community-person-follow {
  flex-shrink: 0;
}

.community-ranking-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.8rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 0.9rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.community-ranking-row:hover {
  border-color: color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
}

.community-ranking-index {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-subtle));
  color: var(--primary-color);
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.community-ranking-stats {
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.community-ranking-stats span {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.markdown-preview :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin: 1.6em 0 0.6em;
  letter-spacing: -0.02em;
  font-weight: 700;
  scroll-margin-top: 4rem;
}

.markdown-preview :deep(h1:first-child),
.markdown-preview :deep(h2:first-child),
.markdown-preview :deep(h3:first-child) {
  margin-top: 0;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0 0 1rem;
}

.markdown-preview :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.75rem 1.25rem;
  border-left: 4px solid var(--primary-color);
  border-radius: 0 0.5rem 0.5rem 0;
  background: color-mix(in srgb, var(--primary-color) 5%, transparent);
}

.markdown-preview :deep(pre) {
  margin: 1rem 0;
  padding: 1.25rem;
  border-radius: 0.85rem;
  border: 1px solid var(--app-code-border);
  background: var(--app-code-bg);
  color: var(--app-code-text);
  overflow-x: auto;
  line-height: 1.6;
}

.markdown-preview :deep(.markdown-code-block) {
  margin: 1rem 0;
  border: 1px solid var(--app-code-border);
  border-radius: 0.85rem;
  background: var(--app-code-bg);
  color: var(--app-code-text);
  overflow: hidden;
}

.markdown-preview :deep(.markdown-code-toolbar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 0.95rem;
  border-bottom: 1px solid color-mix(in srgb, var(--app-code-border) 78%, transparent);
  background: color-mix(in srgb, var(--app-panel-subtle) 18%, var(--app-code-bg));
}

.markdown-preview :deep(.markdown-code-language) {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--app-code-text) 72%, white 8%);
}

.markdown-preview :deep(.markdown-code-copy) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.5rem;
  padding: 0.38rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--app-code-border) 80%, transparent);
  border-radius: 999px;
  background: transparent;
  color: var(--app-code-text);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.markdown-preview :deep(.markdown-code-copy:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 45%, var(--app-code-border));
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.markdown-preview :deep(.markdown-code-copy:focus-visible) {
  outline: 2px solid color-mix(in srgb, var(--primary-color) 65%, white 12%);
  outline-offset: 2px;
}

.markdown-preview :deep(.markdown-code-copy[data-copied='true']) {
  border-color: color-mix(in srgb, var(--primary-color) 48%, var(--app-code-border));
  background: color-mix(in srgb, var(--primary-color) 18%, transparent);
  color: color-mix(in srgb, var(--primary-color) 78%, white 12%);
}

.markdown-preview :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown-preview :deep(.markdown-code-block pre) {
  margin: 0;
  padding: 1rem 1.1rem 1.15rem;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.markdown-preview :deep(.markdown-code-block pre code) {
  display: block;
  min-width: max-content;
  font-size: 0.86em;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 0.7rem;
  border: 1px solid var(--app-border);
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25rem;
}

:global(::view-transition-old(community-active-post)),
:global(::view-transition-new(community-active-post)) {
  animation-duration: 360ms;
  animation-timing-function: cubic-bezier(0.2, 0.9, 0.2, 1);
}

:global(::view-transition-group(community-active-post)) {
  z-index: 12;
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
  .community-command-shortcut {
    display: none;
  }

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
}
</style>
