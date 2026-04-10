import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Avatar, Button, Chip, Spinner } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { postApi } from '../../api';
import * as followApi from '../../api/follow';
import { PostCard } from '../../components';
import { AppIcon } from '../../components/common/AppIcon';
import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import type { CommunityStackParamList } from '../../navigation/types';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore, useCommunityStore } from '../../stores';
import { useAppTheme } from '../../theme';
import type { PostListItemResponse, UserProfileResponse } from '../../types';

import {
  getCommunityErrorMessage,
  getUserAvatarFallback,
  resolveCommunityAssetUrl,
} from '../../components/community/communityUtils';
import { prefetchImages } from '../../utils/imageCache';

type Props = NativeStackScreenProps<CommunityStackParamList, 'UserProfile'>;

type FeedbackState = {
  status: 'accent' | 'warning' | 'danger';
  title: string;
  description: string;
} | null;

const PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readArrayCandidate<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

function extractPaginatedItems<T>(value: unknown): T[] {
  const directArray = readArrayCandidate<T>(value);

  if (directArray) {
    return directArray;
  }

  if (!isRecord(value)) {
    return [];
  }

  const nestedData = isRecord(value.data) ? value.data : null;
  const candidates = [
    value.list,
    value.records,
    value.items,
    value.content,
    nestedData?.list,
    nestedData?.records,
    nestedData?.items,
    nestedData?.content,
  ];

  for (const candidate of candidates) {
    const resolved = readArrayCandidate<T>(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return [];
}

function extractPaginatedTotal(value: unknown): number | null {
  const readNumberCandidate = (candidate: unknown): number | null => {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  if (!isRecord(value)) {
    return null;
  }

  const nestedData = isRecord(value.data) ? value.data : null;
  const candidates = [
    value.total,
    value.totalElements,
    value.count,
    nestedData?.total,
    nestedData?.totalElements,
    nestedData?.count,
  ];

  for (const candidate of candidates) {
    const resolved = readNumberCandidate(candidate);

    if (resolved !== null) {
      return Math.max(resolved, 0);
    }
  }

  return null;
}

function mergePaginatedPosts(
  existingPosts: PostListItemResponse[],
  incomingPosts: PostListItemResponse[],
  page: number,
): PostListItemResponse[] {
  if (page <= 1) {
    return incomingPosts;
  }

  const mergedPosts = [...existingPosts];
  const existingIds = new Set(existingPosts.map(post => post.id));

  for (const post of incomingPosts) {
    if (existingIds.has(post.id)) {
      continue;
    }

    mergedPosts.push(post);
  }

  return mergedPosts;
}

function updatePosts(
  posts: PostListItemResponse[],
  postId: string,
  updater: (post: PostListItemResponse) => PostListItemResponse,
): PostListItemResponse[] {
  return posts.map(post => (post.id === postId ? updater(post) : post));
}

function normalizeExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function buildGithubUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://github.com/${value.replace(/^@/, '')}`;
}

function formatJoinedAtLabel(value: string, language: 'zh-CN' | 'en-US'): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(language, {
    year: 'numeric',
    month: language === 'en-US' ? 'short' : 'long',
    day: 'numeric',
  });
}

function extractTechTags(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[，,、/|;；]/)
        .map(item => item.trim())
        .filter(item => item.length > 0),
    ),
  ).slice(0, 8);
}

function ProfileInfoRow({ label, value }: { label: string; value: string }) {
  const { typography } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-[10px] bg-background px-3 py-2.5">
      <Text className={`${typography.bodySmall} text-foreground/45`}>{label}</Text>
      <Text
        className={`${typography.bodySmall} min-w-0 flex-1 text-right text-foreground/78`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function ProfilePanel({
  profile,
  isOwnProfile,
  isFollowing,
  onOpenWebsite,
  onOpenGithub,
  onToggleFollow,
}: {
  profile: UserProfileResponse;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onOpenWebsite: () => void;
  onOpenGithub: () => void;
  onToggleFollow: () => void;
}) {
  const { typography } = useAppTheme();
  const { isEnglish, language, t } = useI18n();
  const avatarUri = resolveCommunityAssetUrl(profile.avatar);
  const joinedAtLabel = formatJoinedAtLabel(profile.createdAt, language);
  const subtitle = [profile.company, profile.location].filter(Boolean).join(' · ');
  const techTags = extractTechTags(profile.techStack);
  const hasMetaInfo = Boolean(profile.location || profile.company || profile.primaryLanguage);
  const hasLinks = Boolean(profile.website || profile.github);
  const hasExtendedInfo = Boolean(profile.techStack || hasMetaInfo || hasLinks || joinedAtLabel);

  return (
    <View className="gap-4 rounded-[12px] bg-content1 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <Avatar alt={`${profile.nickname} 的头像`} color="accent" size="lg">
          {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
          <Avatar.Fallback>{getUserAvatarFallback(profile.nickname)}</Avatar.Fallback>
        </Avatar>

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 gap-1">
              <Text className={`${typography.h2} text-foreground`} numberOfLines={1}>
                {profile.nickname}
              </Text>
              {subtitle ? (
                <Text className={`${typography.bodySmall} text-foreground/55`} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : joinedAtLabel ? (
                <Text className={`${typography.bodySmall} text-foreground/50`} numberOfLines={1}>
                  {isEnglish ? `${t('加入于')} ${joinedAtLabel}` : `加入于 ${joinedAtLabel}`}
                </Text>
              ) : null}
            </View>

            {!isOwnProfile ? (
              <Button size="sm" variant={isFollowing ? 'outline' : 'primary'} onPress={onToggleFollow}>
                {isFollowing ? t('已关注') : t('关注')}
              </Button>
            ) : null}
          </View>

          <Text className={`${typography.bodySmall} leading-5 text-foreground/72`} numberOfLines={4}>
            {profile.bio ?? t('这个人还没有写简介。')}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="min-w-0 flex-1 rounded-[10px] bg-background px-3 py-2.5">
          <Text className={`${typography.bodySmall} text-foreground/45`}>{t('帖子')}</Text>
          <Text className={`${typography.h3} mt-0.5 text-foreground`}>{profile.postCount}</Text>
        </View>
        <View className="min-w-0 flex-1 rounded-[10px] bg-background px-3 py-2.5">
          <Text className={`${typography.bodySmall} text-foreground/45`}>{t('关注')}</Text>
          <Text className={`${typography.h3} mt-0.5 text-foreground`}>{profile.followingCount}</Text>
        </View>
        <View className="min-w-0 flex-1 rounded-[10px] bg-background px-3 py-2.5">
          <Text className={`${typography.bodySmall} text-foreground/45`}>{t('粉丝')}</Text>
          <Text className={`${typography.h3} mt-0.5 text-foreground`}>{profile.followerCount}</Text>
        </View>
      </View>

      {hasExtendedInfo ? (
        <View className="gap-3 border-t border-border/60 pt-3">
          <Text className={`${typography.bodySmall} text-foreground/45`}>{t('公开信息')}</Text>

          {hasMetaInfo ? (
            <View className="flex-row flex-wrap gap-2">
              {profile.primaryLanguage ? (
                <Chip color="accent" size="sm" variant="soft">
                  {isEnglish ? `${t('主语言')} ${profile.primaryLanguage}` : `主语言 ${profile.primaryLanguage}`}
                </Chip>
              ) : null}
              {profile.company ? (
                <Chip color="default" size="sm" variant="soft">
                  {profile.company}
                </Chip>
              ) : null}
              {profile.location ? (
                <Chip color="default" size="sm" variant="soft">
                  {profile.location}
                </Chip>
              ) : null}
            </View>
          ) : null}

          {techTags.length > 0 ? (
            <View className="gap-2">
              <Text className={`${typography.bodySmall} text-foreground/45`}>{t('技术栈')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {techTags.map(tag => (
                  <Chip key={tag} color="default" size="sm" variant="soft">
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          <View className="gap-2">
            {joinedAtLabel ? <ProfileInfoRow label={t('加入时间')} value={joinedAtLabel} /> : null}
            {profile.website ? <ProfileInfoRow label={t('个人网站')} value={profile.website} /> : null}
            {profile.github ? <ProfileInfoRow label="GitHub" value={profile.github} /> : null}
          </View>

          {hasLinks ? (
            <View className="flex-row gap-2">
              {profile.website ? (
                <Button size="sm" variant="outline" onPress={onOpenWebsite}>
                  {t('个人网站')}
                </Button>
              ) : null}
              {profile.github ? (
                <Button size="sm" variant="outline" onPress={onOpenGithub}>
                  GitHub
                </Button>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { isTablet } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  const currentUserId = useAuthStore(state => state.user?.id ?? null);
  const {
    followingIds,
    fetchFollowingIds,
    follow,
    unfollow,
    likePost,
    unlikePost,
    collectPost,
    uncollectPost,
  } = useCommunityStore(useShallow(state => ({
    followingIds: Array.isArray(state.followingIds) ? state.followingIds : [],
    fetchFollowingIds: state.fetchFollowingIds,
    follow: state.follow,
    unfollow: state.unfollow,
    likePost: state.likePost,
    unlikePost: state.unlikePost,
    collectPost: state.collectPost,
    uncollectPost: state.uncollectPost,
  })));

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [userPosts, setUserPosts] = useState<PostListItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const isOwnProfile = currentUserId === userId;
  const isFollowing = !isOwnProfile && (followingIds.includes(userId) || profile?.isFollowing === true);
  const loading = loadingProfile || loadingPosts;

  useEffect(() => {
    prefetchImages([
      ...(profile ? [resolveCommunityAssetUrl(profile.avatar)] : []),
      ...userPosts.map(p => resolveCommunityAssetUrl(p.authorAvatar)),
    ]);
  }, [profile, userPosts]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);

    try {
      const nextProfile = await followApi.getUserProfile(userId);
      setProfile(nextProfile);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async (nextPage: number) => {
    if (nextPage <= 1) {
      setLoadingPosts(true);
    }

    try {
      const response = await postApi.listUserPosts(userId, {
        page: nextPage,
        size: PAGE_SIZE,
      });
      const nextPosts = extractPaginatedItems<PostListItemResponse>(response);
      const totalPosts = extractPaginatedTotal(response);

      setUserPosts(previousPosts => {
        const mergedPosts = mergePaginatedPosts(previousPosts, nextPosts, nextPage);
        setHasMore(
          totalPosts !== null ? mergedPosts.length < totalPosts : nextPosts.length >= PAGE_SIZE,
        );
        return mergedPosts;
      });
      setPage(nextPage);
    } finally {
      if (nextPage <= 1) {
        setLoadingPosts(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setProfile(null);
      setUserPosts([]);
      setPage(1);
      setHasMore(true);
      setFeedback(null);

      try {
        await Promise.all([loadProfile(), loadPosts(1)]);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setFeedback({
          status: 'danger',
          title: t('用户主页加载失败'),
          description: getCommunityErrorMessage(error, t('请稍后重试。')),
        });
      }

      try {
        await fetchFollowingIds();
      } catch (error) {
        if (!mounted) {
          return;
        }

        setFeedback(current =>
          current ?? {
            status: 'warning',
            title: t('关注状态更新失败'),
            description: getCommunityErrorMessage(error, t('稍后可下拉刷新重试。')),
          },
        );
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [fetchFollowingIds, loadPosts, loadProfile, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);

    try {
      await Promise.all([loadProfile(), loadPosts(1), fetchFollowingIds()]);
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('刷新失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore || userPosts.length === 0) {
      return;
    }

    setLoadingMore(true);

    try {
      await loadPosts(page + 1);
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: t('加载更多失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile || isOwnProfile) {
      return;
    }

    const previousProfile = profile;
    const nextIsFollowing = !isFollowing;

    setProfile({
      ...profile,
      isFollowing: nextIsFollowing,
      followerCount: Math.max(profile.followerCount + (nextIsFollowing ? 1 : -1), 0),
    });

    try {
      setFeedback(null);
      if (nextIsFollowing) {
        await follow(userId);
      } else {
        await unfollow(userId);
      }
    } catch (error) {
      setProfile(previousProfile);
      setFeedback({
        status: 'warning',
        title: t('关注操作失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleToggleLike = async (post: PostListItemResponse) => {
    const previousPosts = userPosts;

    setUserPosts(currentPosts =>
      updatePosts(currentPosts, post.id, item => ({
        ...item,
        isLiked: !item.isLiked,
        likeCount: item.isLiked ? Math.max(item.likeCount - 1, 0) : item.likeCount + 1,
      })),
    );

    try {
      setFeedback(null);
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      setUserPosts(previousPosts);
      setFeedback({
        status: 'warning',
        title: t('点赞失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleToggleCollect = async (post: PostListItemResponse) => {
    const previousPosts = userPosts;

    setUserPosts(currentPosts =>
      updatePosts(currentPosts, post.id, item => ({
        ...item,
        isCollected: !item.isCollected,
        collectCount: item.isCollected ? Math.max(item.collectCount - 1, 0) : item.collectCount + 1,
      })),
    );

    try {
      setFeedback(null);
      if (post.isCollected) {
        await uncollectPost(post.id);
      } else {
        await collectPost(post.id);
      }
    } catch (error) {
      setUserPosts(previousPosts);
      setFeedback({
        status: 'warning',
        title: t('收藏失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleOpenWebsite = async () => {
    if (!profile?.website) {
      return;
    }

    try {
      await Linking.openURL(normalizeExternalUrl(profile.website));
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: t('无法打开网站'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleOpenGithub = async () => {
    if (!profile?.github) {
      return;
    }

    try {
      await Linking.openURL(buildGithubUrl(profile.github));
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: t('无法打开 GitHub'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const profilePanel = profile ? (
    <ProfilePanel
      isFollowing={isFollowing}
      isOwnProfile={isOwnProfile}
      onOpenGithub={() => {
        void handleOpenGithub();
      }}
      onOpenWebsite={() => {
        void handleOpenWebsite();
      }}
      profile={profile}
      onToggleFollow={() => {
        void handleToggleFollow();
      }}
    />
  ) : null;

  const renderPostCard = ({ item }: { item: PostListItemResponse }) => (
    <View className={isTablet ? 'flex-1 px-1.5 pb-3' : 'pb-3'}>
      <PostCard
        post={item}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        onPressAuthor={() => undefined}
        onPressComment={() => navigation.navigate('PostDetail', { postId: item.id })}
        onPressLike={() => {
          void handleToggleLike(item);
        }}
        onPressCollect={() => {
          void handleToggleCollect(item);
        }}
      />
    </View>
  );

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View className="items-center py-4">
          <Spinner size="sm" />
        </View>
      );
    }

    if (userPosts.length > 0 && !hasMore) {
      return (
        <View className="items-center py-4">
          <Text className={`${typography.bodySmall} text-foreground/45`}>
            {t('没有更多帖子了')}
          </Text>
        </View>
      );
    }

    return <View className="h-3" />;
  };

  const renderEmpty = () => {
    if (loading && userPosts.length === 0) {
      return (
        <View className="items-center gap-3 px-4 py-12">
          <Spinner />
          <Text className={`${typography.body} text-foreground/60`}>
            {t('正在加载用户主页...')}
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center gap-3 px-4 py-12">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-content1">
          <Text className="text-3xl">🗂</Text>
        </View>
        <Text className={`${typography.body} text-foreground/65`}>
          {t('这个用户还没有发布帖子。')}
        </Text>
      </View>
    );
  };

  const headerContent = (
    <View className="gap-3 pb-3">
      {feedback ? (
        <Alert status={feedback.status}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{feedback.title}</Alert.Title>
            <Alert.Description>{feedback.description}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {profilePanel}

      <View>
        <Text className={`${typography.h3} text-foreground`}>
          {isOwnProfile ? t('我的帖子') : t('TA 的帖子')}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        {isTablet ? (
        <View className="flex-1 flex-row gap-4 px-4 pb-4 pt-4">
          <View className="w-[284px] gap-3">
            {feedback ? (
              <Alert status={feedback.status}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{feedback.title}</Alert.Title>
                  <Alert.Description>{feedback.description}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
            {profilePanel}
          </View>

          <View className="flex-1">
            <View className="pb-4">
              <Text className={`${typography.h3} text-foreground`}>
                {isOwnProfile ? t('我的帖子') : t('TA 的帖子')}
              </Text>
            </View>
            <FlatList
              columnWrapperStyle={{ gap: 0 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              data={userPosts}
              key="user-profile-grid"
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderListFooter}
              numColumns={2}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
              renderItem={renderPostCard}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                void handleLoadMore();
              }}
              onEndReachedThreshold={0.4}
            />
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <View
            className="flex-row items-center gap-3 border-b px-4 pb-2.5 pt-1"
            style={{ borderBottomColor: palette.border, backgroundColor: palette.surface }}>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: palette.surfaceAlt }}
              onPress={() => navigation.goBack()}>
              <AppIcon color={palette.text} name="arrow-left" size={18} />
            </Pressable>
            <Text className={`${typography.h3} min-w-0 flex-1`} numberOfLines={1} style={{ color: palette.text }}>
              {profile?.nickname ?? t('用户主页')}
            </Text>
          </View>
          <FlatList
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
            data={userPosts}
            key="user-profile-list"
            keyExtractor={item => item.id}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderListFooter}
            ListHeaderComponent={headerContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
            renderItem={renderPostCard}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              void handleLoadMore();
            }}
            onEndReachedThreshold={0.4}
          />
        </View>
        )}
      </SafeAreaView>
    </View>
  );
}
