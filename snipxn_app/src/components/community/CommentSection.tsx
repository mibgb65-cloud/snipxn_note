import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore, useCommunityStore } from '../../stores';
import { useAppTheme } from '../../theme';
import type { CommentResponse } from '../../types';
import { AppIcon } from '../common/AppIcon';

import { CommentItem } from './CommentItem';
import { getCommunityErrorMessage } from './communityUtils';

export interface CommentSectionProps {
  postId: string;
  headerComponent?: React.ReactElement | null;
  onPressUser: (userId: string) => void;
  onReply: (comment: CommentResponse) => void;
}

export function CommentSection({
  postId,
  headerComponent = null,
  onPressUser,
  onReply,
}: CommentSectionProps) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const currentUserId = useAuthStore(state => state.user?.id ?? null);
  const { comments, loading, fetchComments, fetchReplies, deleteComment, likeComment, unlikeComment } = useCommunityStore(useShallow(state => ({
    comments: state.comments,
    loading: state.loading,
    fetchComments: state.fetchComments,
    fetchReplies: state.fetchReplies,
    deleteComment: state.deleteComment,
    likeComment: state.likeComment,
    unlikeComment: state.unlikeComment,
  })));

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const topLevelComments = useMemo(
    () => comments.filter(comment => comment.parentId === null),
    [comments],
  );
  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentResponse[]>();

    for (const comment of comments) {
      if (!comment.parentId) {
        continue;
      }

      const existingReplies = map.get(comment.parentId) ?? [];
      existingReplies.push(comment);
      map.set(comment.parentId, existingReplies);
    }

    return map;
  }, [comments]);

  const loadCommentsPage = useCallback(async (nextPage: number) => {
    const beforeCount = useCommunityStore.getState().comments.filter(comment => comment.parentId === null).length;
    await fetchComments(postId, nextPage);
    const afterCount = useCommunityStore.getState().comments.filter(comment => comment.parentId === null).length;
    setPage(nextPage);
    setHasMore(nextPage === 1 ? afterCount > 0 : afterCount > beforeCount);
  }, [fetchComments, postId]);

  useEffect(() => {
    let mounted = true;

    const loadInitialComments = async () => {
      try {
        setFeedback(null);
        await loadCommentsPage(1);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setFeedback(getCommunityErrorMessage(error, t('加载评论失败，请稍后重试。')));
      }
    };

    void loadInitialComments();

    return () => {
      mounted = false;
    };
  }, [loadCommentsPage, postId, t]);

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore || topLevelComments.length === 0) {
      return;
    }

    setLoadingMore(true);

    try {
      setFeedback(null);
      await loadCommentsPage(page + 1);
    } catch (error) {
      setFeedback(getCommunityErrorMessage(error, t('加载更多评论失败，请稍后重试。')));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    setLoadingReplyId(commentId);

    try {
      setFeedback(null);
      await fetchReplies(postId, commentId, 1);
    } catch (error) {
      setFeedback(getCommunityErrorMessage(error, t('加载回复失败，请稍后重试。')));
    } finally {
      setLoadingReplyId(currentId => (currentId === commentId ? null : currentId));
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setFeedback(null);
      await deleteComment(postId, commentId);
    } catch (error) {
      setFeedback(getCommunityErrorMessage(error, t('删除评论失败，请稍后重试。')));
    }
  };

  const handleToggleLike = async (comment: CommentResponse) => {
    try {
      setFeedback(null);
      if (comment.isLiked) {
        await unlikeComment(postId, comment.id);
      } else {
        await likeComment(postId, comment.id);
      }
    } catch (error) {
      setFeedback(getCommunityErrorMessage(error, t('评论点赞失败，请稍后重试。')));
    }
  };

  const renderEmpty = () => {
    if (loading && topLevelComments.length === 0) {
      return (
        <View className="items-center gap-3 px-4 py-10">
          <Spinner size="sm" />
          <Text className={`${typography.body} text-foreground/60`}>
            {t('正在加载评论...')}
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center gap-2 px-4 py-10">
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.accentSoft }}>
          <AppIcon color={palette.accent} name="message-square" size={26} />
        </View>
        <Text className={`${typography.body} text-foreground/60`}>
          {t('暂无评论')}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="items-center py-4">
          <Spinner size="sm" />
        </View>
      );
    }

    if (topLevelComments.length > 0 && !hasMore) {
      return (
        <View className="items-center py-4">
          <Text className={`${typography.bodySmall} text-foreground/45`}>
            {t('评论已经到底了')}
          </Text>
        </View>
      );
    }

    return <View className="h-2" />;
  };

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 16 }}
      data={topLevelComments}
      keyboardShouldPersistTaps="handled"
      keyExtractor={item => item.id}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      ListHeaderComponent={
        <View className="gap-4 pb-4">
          {headerComponent}
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <AppIcon color={palette.accent} name="message-square" size={18} />
              <Text className={`${typography.h3} text-foreground`}>{t('评论区')}</Text>
            </View>
            {feedback ? (
              <Text className={`${typography.bodySmall} mt-2 text-danger`}>
                {feedback}
              </Text>
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <CommentItem
          comment={item}
          currentUserId={currentUserId}
          isLoadingReplies={loadingReplyId === item.id}
          replies={repliesByParent.get(item.id) ?? []}
          onDelete={commentId => {
            void handleDelete(commentId);
          }}
          onLoadReplies={commentId => {
            void handleLoadReplies(commentId);
          }}
          onPressUser={onPressUser}
          onReply={onReply}
          onToggleLike={comment => {
            void handleToggleLike(comment);
          }}
        />
      )}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        void handleLoadMore();
      }}
      onEndReachedThreshold={0.35}
    />
  );
}
