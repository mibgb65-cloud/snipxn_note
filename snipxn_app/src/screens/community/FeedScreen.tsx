import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Avatar, Button, Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import * as postApi from '../../api/post';
import { AppCanvas, GlassPanel, IconBadge, MetricPill, SectionEyebrow } from '../../components/common';
import { TabPageHeader } from '../../components/common/TabPageHeader';
import { prefetchImages } from '../../utils/imageCache';
import { AppIcon } from '../../components/common/AppIcon';
import {
  APP_CARD_ENTERING,
  APP_HEADER_ENTERING,
  APP_HEADER_EXITING,
  APP_LAYOUT_TRANSITION,
  MotionPressable,
} from '../../components/common/AppMotion';
import {
  getCommunityErrorMessage,
  getUserAvatarFallback,
  resolveCommunityAssetUrl,
} from '../../components/community/communityUtils';
import { useI18n } from '../../i18n';
import { PostCard } from '../../components/community/PostCard';
import { useDeviceType } from '../../hooks';
import type { CommunityStackParamList } from '../../navigation/types';
import { useShallow } from 'zustand/react/shallow';

import { useCommunityStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { PostListItemResponse, UserProfileResponse } from '../../types';

const SEARCH_FIELDS = ['title', 'summary', 'authorNickname', 'language'] as const;
const PAGE_SIZE = 20;

type FeedTab = 'latest' | 'hot';

type FeedbackState = {
  status: 'accent' | 'warning' | 'danger';
  title: string;
  description: string;
} | null;

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

function matchesSearch(post: PostListItemResponse, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    SEARCH_FIELDS.some(field => {
      const value = post[field];
      return typeof value === 'string' && value.toLowerCase().includes(normalizedQuery);
    }) || post.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
  );
}

function FeedTextTab({
  active,
  label,
  onLayout,
  onPress,
}: {
  active: boolean;
  label: string;
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onLayout={onLayout}
      onPress={onPress}
      style={{ paddingTop: 2, paddingBottom: 12 }}>
      <Text
        style={{
          color: active ? palette.primary : palette.textSoft,
          fontSize: 17,
          fontWeight: active ? '700' : '600',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FeedSlidingTabs({
  activeTab,
  onChange,
}: {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
}) {
  const { palette } = useAppTheme();
  const { t } = useI18n();
  const [tabLayouts, setTabLayouts] = useState<Partial<Record<FeedTab, { x: number; width: number }>>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    const activeLayout = tabLayouts[activeTab];

    if (!activeLayout) {
      return;
    }

    indicatorX.value = withSpring(activeLayout.x, { damping: 18, stiffness: 220 });
    indicatorWidth.value = withSpring(activeLayout.width, { damping: 18, stiffness: 220 });
  }, [activeTab, indicatorWidth, indicatorX, tabLayouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
    opacity: indicatorWidth.value > 0 ? 1 : 0,
  }));

  const handleLayout =
    (tab: FeedTab) =>
    (event: LayoutChangeEvent): void => {
      const { x, width } = event.nativeEvent.layout;

      setTabLayouts(previousLayouts => {
        const previousLayout = previousLayouts[tab];

        if (previousLayout?.x === x && previousLayout?.width === width) {
          return previousLayouts;
        }

        return {
          ...previousLayouts,
          [tab]: { x, width },
        };
      });
    };

  return (
    <View style={{ alignSelf: 'flex-start', position: 'relative' }}>
      <View className="flex-row items-center gap-6">
        <FeedTextTab
          active={activeTab === 'latest'}
          label={t('最新')}
          onLayout={handleLayout('latest')}
          onPress={() => onChange('latest')}
        />
        <FeedTextTab
          active={activeTab === 'hot'}
          label={t('热榜')}
          onLayout={handleLayout('hot')}
          onPress={() => onChange('hot')}
        />
      </View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          backgroundColor: withAlpha(palette.textSoft, 0.18),
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            borderRadius: 999,
            backgroundColor: palette.primary,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

function FeedSearchField({
  placeholder,
  searchQuery,
  onChangeText,
}: {
  placeholder: string;
  searchQuery: string;
  onChangeText: (value: string) => void;
}) {
  const { palette, typography } = useAppTheme();

  return (
    <View
      className="flex-row items-center gap-2.5 rounded-full border px-3.5 py-2"
      style={{
        borderColor: withAlpha(palette.primary, 0.12),
        backgroundColor: palette.panelInset,
      }}>
      <AppIcon color={palette.primary} name="search" size={16} />
      <TextInput
        autoCapitalize="none"
        className={`${typography.bodySmall} flex-1`}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        returnKeyType="search"
        style={{ color: palette.text, paddingVertical: 0, lineHeight: 18 }}
        value={searchQuery}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function RecommendedUserCard({
  user,
  isFollowing,
  onPress,
  onToggleFollow,
}: {
  user: UserProfileResponse;
  isFollowing: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const avatarUri = resolveCommunityAssetUrl(user.avatar);
  const bioText = user.bio?.trim() || t('这个人还没有写简介。');

  return (
        <View
          className="rounded-[10px] border px-3.5 py-3"
          style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <View className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <MotionPressable
                accessibilityRole="button"
                className="flex-row items-center gap-3"
                onPress={onPress}
                style={{ width: '100%' }}>
                <Avatar alt={`${user.nickname} 的头像`} color="accent" size="sm">
                  {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
                  <Avatar.Fallback>{getUserAvatarFallback(user.nickname)}</Avatar.Fallback>
                </Avatar>

                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className={typography.body} numberOfLines={1} style={{ color: palette.text }}>
                    {user.nickname}
                  </Text>
                  <Text
                    className={typography.bodySmall}
                    numberOfLines={1}
                    style={{ color: palette.textSoft }}>
                    {bioText}
                  </Text>
                </View>
              </MotionPressable>
            </View>

            <Button size="sm" variant={isFollowing ? 'outline' : 'primary'} onPress={onToggleFollow}>
              {isFollowing ? t('已关注') : t('关注')}
            </Button>
          </View>
        </View>
  );
}

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { isTablet } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const safeAreaEdges = isTablet ? (['top', 'left', 'right'] as const) : (['left', 'right'] as const);
  const mobileBottomPadding = isTablet ? 16 : 68 + Math.max(insets.bottom, 10) + 8;

  const {
    posts,
    hotPosts,
    recommendedUsers,
    followingIds,
    fetchRecommended,
    fetchFollowingIds,
    follow,
    unfollow,
    likePost,
    unlikePost,
    collectPost,
    uncollectPost,
  } = useCommunityStore(useShallow(state => ({
    posts: Array.isArray(state.posts) ? state.posts : [],
    hotPosts: Array.isArray(state.hotPosts) ? state.hotPosts : [],
    recommendedUsers: Array.isArray(state.recommendedUsers) ? state.recommendedUsers : [],
    followingIds: Array.isArray(state.followingIds) ? state.followingIds : [],
    fetchRecommended: state.fetchRecommended,
    fetchFollowingIds: state.fetchFollowingIds,
    follow: state.follow,
    unfollow: state.unfollow,
    likePost: state.likePost,
    unlikePost: state.unlikePost,
    collectPost: state.collectPost,
    uncollectPost: state.uncollectPost,
  })));

  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [latestPage, setLatestPage] = useState(1);
  const [hotPage, setHotPage] = useState(1);
  const [latestHasMore, setLatestHasMore] = useState(true);
  const [hotHasMore, setHotHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const currentPosts = activeTab === 'latest' ? posts : hotPosts;
  const filteredPosts = useMemo(
    () => currentPosts.filter(post => matchesSearch(post, searchQuery)),
    [currentPosts, searchQuery],
  );
  const currentPage = activeTab === 'latest' ? latestPage : hotPage;
  const hasMore = activeTab === 'latest' ? latestHasMore : hotHasMore;

  const loadFeedPage = useCallback(
    async (tab: FeedTab, nextPage: number, options?: { background?: boolean }) => {
      const background = options?.background ?? false;

      if (!background) {
        if (nextPage <= 1) {
          setLoadingFeed(true);
        } else {
          setLoadingMore(true);
        }
      }

      try {
        const response =
          tab === 'latest'
            ? await postApi.listPosts({ page: nextPage, size: PAGE_SIZE })
            : await postApi.listHotPosts({ page: nextPage, size: PAGE_SIZE });

        const incomingPosts = extractPaginatedItems<PostListItemResponse>(response);
        const total = extractPaginatedTotal(response);

        if (tab === 'latest') {
          useCommunityStore.setState(state => ({
            posts: mergePaginatedPosts(state.posts, incomingPosts, nextPage),
          }));

          const mergedCount = useCommunityStore.getState().posts.length;
          setLatestPage(nextPage);
          setLatestHasMore(total !== null ? mergedCount < total : incomingPosts.length >= PAGE_SIZE);
        } else {
          useCommunityStore.setState(state => ({
            hotPosts: mergePaginatedPosts(state.hotPosts, incomingPosts, nextPage),
          }));

          const mergedCount = useCommunityStore.getState().hotPosts.length;
          setHotPage(nextPage);
          setHotHasMore(total !== null ? mergedCount < total : incomingPosts.length >= PAGE_SIZE);
        }
      } catch (error) {
        setFeedback({
          status: 'warning',
          title: tab === 'latest' ? t('加载最新帖子失败') : t('加载热门帖子失败'),
          description: getCommunityErrorMessage(error, t('请稍后重试。')),
        });
      } finally {
        if (!background) {
          setLoadingFeed(false);
          setLoadingMore(false);
        }
      }
    },
    [t],
  );

  const loadSidebarData = useCallback(async () => {
    try {
      await Promise.all([fetchRecommended(), fetchFollowingIds()]);
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: t('加载推荐内容失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  }, [fetchFollowingIds, fetchRecommended, t]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setFeedback(null);
      setLoadingFeed(true);

      await Promise.all([
        loadFeedPage('latest', 1),
        loadFeedPage('hot', 1, { background: true }),
        loadSidebarData(),
      ]);

      if (!cancelled) {
        setLoadingFeed(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadFeedPage, loadSidebarData]);

  useEffect(() => {
    prefetchImages([
      ...posts.map(p => resolveCommunityAssetUrl(p.authorAvatar)),
      ...hotPosts.map(p => resolveCommunityAssetUrl(p.authorAvatar)),
      ...recommendedUsers.map(u => resolveCommunityAssetUrl(u.avatar)),
    ]);
  }, [posts, hotPosts, recommendedUsers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setFeedback(null);

    try {
      await Promise.all([loadFeedPage(activeTab, 1, { background: true }), loadSidebarData()]);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadFeedPage, loadSidebarData]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loadingFeed || !hasMore) {
      return;
    }

    await loadFeedPage(activeTab, currentPage + 1);
  }, [activeTab, currentPage, hasMore, loadFeedPage, loadingFeed, loadingMore]);

  const handleToggleLike = async (post: PostListItemResponse) => {
    try {
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: post.isLiked ? t('取消点赞失败') : t('点赞失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleToggleCollect = async (post: PostListItemResponse) => {
    try {
      if (post.isCollected) {
        await uncollectPost(post.id);
      } else {
        await collectPost(post.id);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: post.isCollected ? t('取消收藏失败') : t('收藏失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const handleToggleFollow = async (user: UserProfileResponse) => {
    try {
      const isFollowing = followingIds.includes(user.id) || user.isFollowing === true;

      if (isFollowing) {
        await unfollow(user.id);
      } else {
        await follow(user.id);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        title: t('关注状态更新失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    }
  };

  const renderPostCard = ({ item }: { item: PostListItemResponse }) => (
    <View className={isTablet ? 'flex-1 px-1.5 pb-3' : 'pb-3'}>
      <PostCard
        post={item}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        onPressAuthor={() => navigation.navigate('UserProfile', { userId: item.userId })}
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

    if (currentPosts.length > 0 && !hasMore) {
      return (
        <View className="items-center py-4">
          <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
            {t('没有更多内容了')}
          </Text>
        </View>
      );
    }

    return <View className="h-3" />;
  };

  const renderEmpty = () => {
    if (loadingFeed && currentPosts.length === 0) {
      return (
        <View className="items-center gap-3 px-4 py-12">
          <Spinner />
          <Text className={typography.body} style={{ color: palette.textSoft }}>
            {t('正在加载社区内容...')}
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center gap-3 px-4 py-12">
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.primarySoft }}>
          <AppIcon color={palette.primary} name="community" size={30} />
        </View>
        <Text className={typography.body} style={{ color: palette.textSoft }}>
          {searchQuery.trim().length > 0 ? t('没有匹配的帖子。') : t('暂无帖子内容。')}
        </Text>
      </View>
    );
  };

  const activeTabDescription =
    activeTab === 'latest' ? t('实时更新的最新分享') : t('当前最受欢迎的内容');
  const activeCountLabel = activeTab === 'latest' ? t('篇更新') : t('篇热门');
  const hasSearchQuery = searchQuery.trim().length > 0;

  const tabSwitcher = (
    <FeedSlidingTabs
      activeTab={activeTab}
      onChange={tab => {
        setActiveTab(tab);
        setFeedback(null);
      }}
    />
  );

  const summaryPills = (
    <View className="flex-row flex-wrap gap-2">
      <MetricPill label={`${currentPosts.length} ${activeCountLabel}`} tone="accent" />
      <MetricPill label={`${recommendedUsers.length} ${t('位创作者')}`} />
      {hasSearchQuery ? (
        <MetricPill label={`${filteredPosts.length} ${t('条匹配')}`} tone="cta" />
      ) : null}
    </View>
  );

  return (
    <AppCanvas className="flex-1">
      {!isTablet && <TabPageHeader title={t('社区')} />}
      <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
        <View className="flex-1 px-4 pb-4 pt-4">
          <Animated.View layout={APP_LAYOUT_TRANSITION}>
            {isTablet ? (
              <Animated.View
                entering={APP_HEADER_ENTERING}
                exiting={APP_HEADER_EXITING}
                className="mb-4">
                <GlassPanel className="px-5 py-5" highlight={palette.primary} variant="strong">
                  <View className="gap-4">
                    <View className="flex-row items-start gap-4">
                      <IconBadge
                        backgroundColor={withAlpha(palette.primary, 0.12)}
                        color={palette.primary}
                        icon="community"
                        iconSize={20}
                        round
                        size={48}
                      />
                      <View className="min-w-0 flex-1 gap-2">
                        <View>
                          <SectionEyebrow>{t('社区')}</SectionEyebrow>
                          <Text className={typography.h1} style={{ color: palette.text }}>
                            {t('社区')}
                          </Text>
                          <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                            {activeTabDescription}
                          </Text>
                        </View>

                        {tabSwitcher}

                        <View className="flex-row items-start gap-4">
                          <View className="min-w-0 flex-1">{summaryPills}</View>
                          <View className="w-[300px]">
                            <FeedSearchField
                              placeholder={t('搜索标题、摘要、标签或作者')}
                              searchQuery={searchQuery}
                              onChangeText={setSearchQuery}
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {feedback ? (
                      <Alert status={feedback.status}>
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>{feedback.title}</Alert.Title>
                          <Alert.Description>{feedback.description}</Alert.Description>
                        </Alert.Content>
                      </Alert>
                    ) : null}
                  </View>
                </GlassPanel>
              </Animated.View>
            ) : (
              <Animated.View
                entering={APP_HEADER_ENTERING}
                exiting={APP_HEADER_EXITING}
                className="mb-3 gap-3">
                {tabSwitcher}

                <FeedSearchField
                  placeholder={t('搜索标题、标签或作者')}
                  searchQuery={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {feedback ? (
                  <Alert status={feedback.status}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{feedback.title}</Alert.Title>
                      <Alert.Description>{feedback.description}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}
              </Animated.View>
            )}
          </Animated.View>

          {isTablet ? (
            <View className="flex-1 flex-row gap-4">
              <View className="flex-1">
                <FlatList
                  key="community-grid"
                  columnWrapperStyle={{ gap: 0 }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  data={filteredPosts}
                  initialNumToRender={10}
                  keyExtractor={item => item.id}
                  ListEmptyComponent={renderEmpty}
                  ListFooterComponent={renderListFooter}
                  maxToRenderPerBatch={8}
                  numColumns={2}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
                  removeClippedSubviews
                  renderItem={renderPostCard}
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    void handleLoadMore();
                  }}
                  onEndReachedThreshold={0.45}
                  windowSize={5}
                />
              </View>

              <Animated.View layout={APP_LAYOUT_TRANSITION}>
                <Animated.View
                  entering={APP_CARD_ENTERING}
                  className="w-[300px] gap-4 rounded-[12px] border px-4 py-4"
                  style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
                  <View className="flex-row items-center gap-3">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: palette.primarySoft }}>
                    <AppIcon color={palette.primary} name="user" size={18} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className={typography.h3} style={{ color: palette.text }}>
                      {t('推荐用户')}
                    </Text>
                    <Text className={typography.bodySmall} numberOfLines={2} style={{ color: palette.textSoft }}>
                      {t('关注活跃创作者，快速建立技术圈层')}
                    </Text>
                  </View>
                </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="gap-3 pb-4">
                      {recommendedUsers.map(user => {
                        const isFollowing = followingIds.includes(user.id) || user.isFollowing === true;

                        return (
                          <RecommendedUserCard
                            key={user.id}
                            isFollowing={isFollowing}
                            user={user}
                            onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                            onToggleFollow={() => {
                              void handleToggleFollow(user);
                            }}
                          />
                        );
                      })}
                      {recommendedUsers.length === 0 ? (
                        <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                          {t('暂无推荐用户。')}
                        </Text>
                      ) : null}
                    </View>
                  </ScrollView>
                </Animated.View>
              </Animated.View>
            </View>
          ) : (
            <FlatList
              key="community-list"
              contentContainerStyle={{ paddingBottom: mobileBottomPadding }}
              data={filteredPosts}
              initialNumToRender={10}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderListFooter}
              maxToRenderPerBatch={8}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
              removeClippedSubviews
              renderItem={renderPostCard}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                void handleLoadMore();
              }}
              onEndReachedThreshold={0.45}
              windowSize={5}
            />
          )}
        </View>
      </SafeAreaView>
    </AppCanvas>
  );
}
