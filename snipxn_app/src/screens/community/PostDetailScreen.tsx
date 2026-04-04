import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Button, Chip, Spinner } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

import { postApi } from '../../api';
import { CommentSection } from '../../components';
import { AppIcon } from '../../components/common/AppIcon';
import { MotionPressable } from '../../components/common/AppMotion';
import { CommunityActionPill } from '../../components/community/CommunityActionPill';
import { useI18n } from '../../i18n';
import { useDeviceType } from '../../hooks';
import type { CommunityStackParamList } from '../../navigation/types';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore, useCommunityStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { CommentResponse, PostDetailResponse } from '../../types';

import {
  buildCommunityShareUrl,
  getCommunityErrorMessage,
  getUserAvatarFallback,
  resolveCommunityAssetUrl,
} from '../../components/community/communityUtils';
import { prefetchImages } from '../../utils/imageCache';
import { formatRelativeTime } from '../../utils';

type Props = NativeStackScreenProps<CommunityStackParamList, 'PostDetail'>;

type FeedbackState = {
  status: 'accent' | 'warning' | 'danger';
  message: string;
} | null;

function CommentComposer({
  value,
  replyTarget,
  submitting,
  onChange,
  onCancelReply,
  onSubmit,
}: {
  value: string;
  replyTarget: CommentResponse | null;
  submitting: boolean;
  onChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
}) {
  const { typography } = useAppTheme();
  const { isEnglish, t } = useI18n();

  return (
    <View className="gap-3 border-t border-default-200 bg-background px-4 pb-4 pt-3">
      {replyTarget ? (
        <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-content1 px-3 py-2">
          <Text className={`${typography.bodySmall} min-w-0 flex-1 text-foreground/70`} numberOfLines={1}>
            {isEnglish ? `${t('正在回复')} ${replyTarget.authorNickname}` : `正在回复 ${replyTarget.authorNickname}`}
          </Text>
          <Button size="sm" variant="ghost" onPress={onCancelReply}>
            {t('取消')}
          </Button>
        </View>
      ) : null}
      <View className="flex-row items-end gap-3">
        <TextInput
          className="min-h-[48px] flex-1 rounded-2xl bg-content1 px-4 py-3 text-foreground"
          editable={!submitting}
          multiline
          placeholder={replyTarget ? (isEnglish ? `Reply to ${replyTarget.authorNickname}` : `回复 ${replyTarget.authorNickname}`) : t('写下你的评论...')}
          placeholderTextColor="rgba(120,120,120,0.7)"
          value={value}
          onChangeText={onChange}
        />
        <Button isDisabled={submitting || value.trim().length === 0} variant="primary" onPress={onSubmit}>
          {submitting ? (
            t('发送中...')
          ) : (
            <>
              <AppIcon color="#FFFFFF" name="send" size={14} />
              <Button.Label>{t('发送')}</Button.Label>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

function PostArticle({
  post,
  currentUserId,
  isFollowing,
  onPressAuthor,
  onToggleFollow,
  onToggleLike,
  onToggleCollect,
  onShare,
}: {
  post: PostDetailResponse;
  currentUserId: string | null;
  isFollowing: boolean;
  onPressAuthor: () => void;
  onToggleFollow: () => void;
  onToggleLike: () => void;
  onToggleCollect: () => void;
  onShare: () => void;
}) {
  const { palette, theme, typography } = useAppTheme();
  const { isEnglish, t } = useI18n();
  const avatarUri = resolveCommunityAssetUrl(post.authorAvatar);

  const markdownStyle = useMemo(
    () => ({
      body: {
        color: theme === 'dark' ? '#F5F5F5' : '#18181B',
        fontSize: 15,
        lineHeight: 24,
      },
      heading1: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
      },
      heading2: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
      },
      heading3: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 12,
      },
      bullet_list: {
        marginBottom: 12,
      },
      ordered_list: {
        marginBottom: 12,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme === 'dark' ? '#52525B' : '#D4D4D8',
        color: theme === 'dark' ? '#D4D4D8' : '#52525B',
        paddingLeft: 12,
        marginBottom: 12,
      },
      code_inline: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
      },
      code_block: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 14,
        padding: 14,
      },
      fence: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 14,
        padding: 14,
      },
      link: {
        color: theme === 'dark' ? '#60A5FA' : '#2563EB',
      },
    }),
    [theme],
  );

  return (
    <View
      className="gap-4 rounded-[20px] border px-5 py-4"
      style={{
        borderColor: palette.border,
        backgroundColor: palette.surface,
        shadowColor: palette.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 5,
      }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <MotionPressable
            accessibilityRole="button"
            className="rounded-full"
            onPress={onPressAuthor}
            style={{ backgroundColor: withAlpha(palette.accent, 0.08) }}>
            <Avatar alt={`${post.authorNickname} 的头像`} color="accent" size="sm">
              {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
              <Avatar.Fallback>{getUserAvatarFallback(post.authorNickname)}</Avatar.Fallback>
            </Avatar>
          </MotionPressable>
          <View className="min-w-0 flex-1">
            <Text className={`${typography.body} text-foreground`} numberOfLines={1}>
              {post.authorNickname}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Text className={`${typography.bodySmall} text-foreground/45`} numberOfLines={1}>
                {formatRelativeTime(post.createdAt)}
              </Text>
              <Text className={`${typography.bodySmall} text-foreground/30`}>·</Text>
              <AppIcon color={palette.accent} name="eye" size={13} />
              <Text className={`${typography.bodySmall} text-foreground/45`}>
                {isEnglish ? `${t('浏览')} ${post.viewCount}` : `浏览 ${post.viewCount}`}
              </Text>
            </View>
          </View>
        </View>
        {currentUserId !== post.userId ? (
          <Button size="sm" variant={isFollowing ? 'outline' : 'primary'} onPress={onToggleFollow}>
            {isFollowing ? t('已关注') : t('关注')}
          </Button>
        ) : null}
      </View>

      <View className="gap-3">
        <Text className={`${typography.h1} text-foreground`}>{post.title}</Text>
        <Markdown style={markdownStyle}>{post.content}</Markdown>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {post.language ? (
          <Chip color="accent" size="sm" variant="soft">
            {post.language}
          </Chip>
        ) : null}
        {post.tags.map(tag => (
          <Chip key={tag} color="default" size="sm" variant="soft">
            {tag}
          </Chip>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2 border-t pt-4" style={{ borderTopColor: palette.border }}>
        <CommunityActionPill
          active={post.isLiked}
          activeIcon="heart-filled"
          color={palette.danger}
          icon="heart"
          label={String(post.likeCount)}
          size="md"
          onPress={onToggleLike}
        />
        <CommunityActionPill
          active={post.isCollected}
          activeIcon="bookmark-filled"
          color={palette.warning}
          icon="bookmark"
          label={String(post.collectCount)}
          size="md"
          onPress={onToggleCollect}
        />
        <CommunityActionPill
          color={palette.accent}
          icon="share"
          label={t('分享')}
          size="md"
          onPress={onShare}
        />
        <View
          className="flex-row items-center gap-1.5 rounded-full border px-4 py-2.5"
          style={{
            borderColor: withAlpha(palette.success, 0.28),
            backgroundColor: withAlpha(palette.success, 0.1),
          }}>
          <AppIcon color={palette.success} name="message-square" size={16} />
          <Text className={`${typography.bodySmall} font-medium`} style={{ color: palette.success }}>
            {isEnglish ? `${t('评论')} ${post.commentCount}` : `评论 ${post.commentCount}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { isTablet } = useDeviceType();
  const { typography } = useAppTheme();
  const { t } = useI18n();
  const safeAreaEdges = isTablet ? (['top', 'left', 'right'] as const) : undefined;

  const currentUserId = useAuthStore(state => state.user?.id ?? null);
  const {
    currentPost,
    followingIds,
    loading,
    fetchPostDetail,
    fetchFollowingIds,
    likePost,
    unlikePost,
    collectPost,
    uncollectPost,
    follow,
    unfollow,
    createComment,
  } = useCommunityStore(useShallow(state => ({
    currentPost: state.currentPost,
    followingIds: state.followingIds,
    loading: state.loading,
    fetchPostDetail: state.fetchPostDetail,
    fetchFollowingIds: state.fetchFollowingIds,
    likePost: state.likePost,
    unlikePost: state.unlikePost,
    collectPost: state.collectPost,
    uncollectPost: state.uncollectPost,
    follow: state.follow,
    unfollow: state.unfollow,
    createComment: state.createComment,
  })));

  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<CommentResponse | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    let mounted = true;

    const loadPost = async () => {
      try {
        setFeedback(null);
        await Promise.all([fetchPostDetail(postId), fetchFollowingIds()]);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setFeedback({
          status: 'danger',
          message: getCommunityErrorMessage(error, t('加载帖子失败，请稍后重试。')),
        });
      }
    };

    void loadPost();

    return () => {
      mounted = false;
    };
  }, [fetchFollowingIds, fetchPostDetail, postId, t]);

  const post = currentPost?.id === postId ? currentPost : null;
  const isFollowingAuthor = post ? followingIds.includes(post.userId) : false;

  useEffect(() => {
    if (post) {
      prefetchImages([resolveCommunityAssetUrl(post.authorAvatar)]);
    }
  }, [post]);

  const handleToggleLike = async () => {
    if (!post) {
      return;
    }

    try {
      setFeedback(null);
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        message: getCommunityErrorMessage(error, t('点赞操作失败，请稍后重试。')),
      });
    }
  };

  const handleToggleCollect = async () => {
    if (!post) {
      return;
    }

    try {
      setFeedback(null);
      if (post.isCollected) {
        await uncollectPost(post.id);
      } else {
        await collectPost(post.id);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        message: getCommunityErrorMessage(error, t('收藏操作失败，请稍后重试。')),
      });
    }
  };

  const handleToggleFollow = async () => {
    if (!post || currentUserId === post.userId) {
      return;
    }

    try {
      setFeedback(null);
      if (isFollowingAuthor) {
        await unfollow(post.userId);
      } else {
        await follow(post.userId);
      }
    } catch (error) {
      setFeedback({
        status: 'warning',
        message: getCommunityErrorMessage(error, t('关注操作失败，请稍后重试。')),
      });
    }
  };

  const handleShare = async () => {
    if (!post) {
      return;
    }

    try {
      setFeedback(null);
      const result = await postApi.sharePost(post.id);
      await Share.share({
        title: post.title,
        message: buildCommunityShareUrl(result.shareToken),
      });
    } catch (error) {
      setFeedback({
        status: 'warning',
        message: getCommunityErrorMessage(error, t('分享帖子失败，请稍后重试。')),
      });
    }
  };

  const handleSubmitComment = async () => {
    const content = commentInput.trim();

    if (!post || content.length === 0) {
      return;
    }

    setSubmittingComment(true);

    try {
      setFeedback(null);
      await createComment(post.id, content, replyTarget?.id);
      setCommentInput('');
      setReplyTarget(null);
    } catch (error) {
      setFeedback({
        status: 'danger',
        message: getCommunityErrorMessage(error, t('发表评论失败，请稍后重试。')),
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const article = post ? (
    <PostArticle
      currentUserId={currentUserId}
      isFollowing={isFollowingAuthor}
      post={post}
      onPressAuthor={() => navigation.navigate('UserProfile', { userId: post.userId })}
      onShare={() => {
        void handleShare();
      }}
      onToggleCollect={() => {
        void handleToggleCollect();
      }}
      onToggleFollow={() => {
        void handleToggleFollow();
      }}
      onToggleLike={() => {
        void handleToggleLike();
      }}
    />
  ) : null;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1">
        <View className="flex-1 bg-background">
          {feedback ? (
            <View className="px-4 pt-4">
              <View
                className={`rounded-2xl px-4 py-3 ${
                  feedback.status === 'danger'
                    ? 'bg-danger/10'
                    : feedback.status === 'warning'
                      ? 'bg-warning/10'
                      : 'bg-primary/10'
                }`}>
                <Text className={`${typography.bodySmall} text-foreground`}>
                  {feedback.message}
                </Text>
              </View>
            </View>
          ) : null}

          {!post && loading ? (
            <View className="flex-1 items-center justify-center gap-3 px-6">
              <Spinner />
              <Text className={`${typography.body} text-foreground/60`}>
                {t('正在加载帖子内容...')}
              </Text>
            </View>
          ) : post ? (
            isTablet ? (
              <View className="flex-1 flex-row gap-4 px-4 pb-4 pt-2">
                <View className="flex-[3]">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {article}
                  </ScrollView>
                </View>
                <View className="flex-[2] rounded-[12px] bg-content1">
                  <View className="min-h-0 flex-1 px-4 pt-4">
                    <CommentSection
                      postId={post.id}
                      onPressUser={userId => navigation.navigate('UserProfile', { userId })}
                      onReply={comment => setReplyTarget(comment)}
                    />
                  </View>
                  <CommentComposer
                    replyTarget={replyTarget}
                    submitting={submittingComment}
                    value={commentInput}
                    onCancelReply={() => setReplyTarget(null)}
                    onChange={setCommentInput}
                    onSubmit={() => {
                      void handleSubmitComment();
                    }}
                  />
                </View>
              </View>
            ) : (
              <View className="flex-1 px-4 pb-4 pt-2">
                <View className="min-h-0 flex-1">
                  <CommentSection
                    headerComponent={article}
                    postId={post.id}
                    onPressUser={userId => navigation.navigate('UserProfile', { userId })}
                    onReply={comment => setReplyTarget(comment)}
                  />
                </View>
                <CommentComposer
                  replyTarget={replyTarget}
                  submitting={submittingComment}
                  value={commentInput}
                  onCancelReply={() => setReplyTarget(null)}
                  onChange={setCommentInput}
                  onSubmit={() => {
                    void handleSubmitComment();
                  }}
                />
              </View>
            )
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className={`${typography.body} text-foreground/60`}>
                {t('未找到帖子内容。')}
              </Text>
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
