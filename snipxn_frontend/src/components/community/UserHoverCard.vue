<template>
  <Popover ref="popoverRef" class="user-hovercard-popover">
    <div class="user-hovercard">
      <div v-if="loading" class="user-hovercard-loading">
        <i class="pi pi-spin pi-spinner" />
      </div>

      <template v-else-if="profile">
        <div class="user-hovercard-hero">
          <Avatar
            v-if="profile.avatar"
            :image="profile.avatar"
            shape="circle"
            class="user-hovercard-avatar"
          />
          <Avatar
            v-else
            :label="avatarInitial"
            shape="circle"
            class="user-hovercard-avatar"
          />

          <div class="user-hovercard-info">
            <strong class="user-hovercard-name">{{ profile.nickname || t('common.unknown') }}</strong>
            <p v-if="profile.bio" class="user-hovercard-bio">{{ truncatedBio }}</p>
          </div>
        </div>

        <div v-if="profile.primaryLanguage || profile.location || techStackTags.length" class="user-hovercard-lang">
          <span v-if="profile.primaryLanguage" class="user-hovercard-lang-chip">{{ profile.primaryLanguage }}</span>
          <span v-for="tag in techStackTags" :key="tag" class="user-hovercard-lang-chip">{{ tag }}</span>
          <span v-if="profile.location" class="user-hovercard-location">
            <i class="pi pi-map-marker" /> {{ profile.location }}
          </span>
        </div>

        <div class="user-hovercard-stats">
          <div class="user-hovercard-stat">
            <span class="user-hovercard-stat-value">{{ profile.postCount || 0 }}</span>
            <span class="user-hovercard-stat-label">{{ t('community.userProfile.posts') }}</span>
          </div>
          <div class="user-hovercard-stat">
            <span class="user-hovercard-stat-value">{{ profile.followerCount || 0 }}</span>
            <span class="user-hovercard-stat-label">{{ t('community.userProfile.followers') }}</span>
          </div>
          <div class="user-hovercard-stat">
            <span class="user-hovercard-stat-value">{{ profile.followingCount || 0 }}</span>
            <span class="user-hovercard-stat-label">{{ t('community.userProfile.following') }}</span>
          </div>
        </div>

        <div class="user-hovercard-actions">
          <Button
            v-if="!isSelf"
            size="small"
            :label="profile.isFollowing ? t('community.userProfile.unfollow') : t('community.userProfile.follow')"
            :severity="profile.isFollowing ? 'secondary' : undefined"
            :outlined="!profile.isFollowing"
            :loading="followLoading"
            class="user-hovercard-follow-btn"
            @click.stop="handleToggleFollow"
          />
          <Button
            size="small"
            :label="t('community.userProfile.viewProfile')"
            severity="secondary"
            text
            icon="pi pi-arrow-right"
            icon-pos="right"
            class="user-hovercard-view-btn"
            @click="handleViewProfile"
          />
        </div>
      </template>
    </div>
  </Popover>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import { useCommunityStore } from '../../stores/community';
import { useAuthStore } from '../../stores/auth';
import { getUserProfile } from '../../api/user';
import { getAvatarLabel } from '../../utils/avatar';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const communityStore = useCommunityStore();
const authStore = useAuthStore();

const popoverRef = ref(null);
const loading = ref(false);
const followLoading = ref(false);
const profile = ref(null);
const targetUserId = ref(null);

const currentUserId = computed(() => authStore.user?.id ?? null);
const isSelf = computed(() => currentUserId.value && currentUserId.value === targetUserId.value);
const avatarInitial = computed(() => getAvatarLabel(profile.value?.nickname || '?'));
const truncatedBio = computed(() => {
  const bio = profile.value?.bio || '';
  return bio.length > 80 ? bio.slice(0, 80) + '...' : bio;
});
const techStackTags = computed(() => {
  const raw = profile.value?.techStack || '';
  return raw.split(',').filter(Boolean).slice(0, 3).map(s => s.trim());
});

async function show(event, userId) {
  targetUserId.value = userId;
  profile.value = null;
  popoverRef.value?.toggle(event);

  loading.value = true;
  try {
    const res = await getUserProfile(userId);
    profile.value = res.data || null;
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleToggleFollow() {
  if (!targetUserId.value) return;
  followLoading.value = true;
  try {
    await communityStore.toggleFollow(targetUserId.value);
    // refresh profile data
    const res = await getUserProfile(targetUserId.value);
    profile.value = res.data || null;
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

function handleViewProfile() {
  popoverRef.value?.hide();
  if (targetUserId.value) {
    router.push({ name: 'userProfile', params: { userId: targetUserId.value } });
  }
}

defineExpose({ show });
</script>

<style scoped>
:global(.user-hovercard-popover.p-popover) {
  border: 1px solid var(--app-border) !important;
  border-radius: 0.5rem !important;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent) !important;
  color: var(--text-color) !important;
  box-shadow: var(--app-shadow) !important;
}

:global(.user-hovercard-popover .p-popover-content) {
  padding: 1rem !important;
  background: transparent !important;
  color: var(--text-color) !important;
}

:global(html.app-dark .user-hovercard-popover.p-popover) {
  border-color: var(--app-border-strong) !important;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent) !important;
}

.user-hovercard {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 280px;
  max-width: 320px;
}

.user-hovercard-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
  color: var(--text-color-secondary);
  font-size: 1.2rem;
}

.user-hovercard-hero {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.user-hovercard-avatar {
  width: 3.2rem !important;
  height: 3.2rem !important;
  font-size: 1.1rem !important;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-subtle));
  color: var(--primary-color);
  border: 1.5px solid color-mix(in srgb, var(--primary-color) 14%, var(--app-border));
}

.user-hovercard-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-hovercard-name {
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-color);
  line-height: 1.3;
}

.user-hovercard-bio {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-color-secondary);
}

.user-hovercard-lang {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.user-hovercard-lang-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
  color: var(--primary-color);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.user-hovercard-location {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.76rem;
  color: var(--text-color-secondary);
}

.user-hovercard-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
  padding: 0.65rem 0;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.user-hovercard-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.user-hovercard-stat-value {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-color);
}

.user-hovercard-stat-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.user-hovercard-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-hovercard-follow-btn {
  flex: 1;
}

.user-hovercard-view-btn {
  flex-shrink: 0;
  margin-left: auto;
}
</style>
