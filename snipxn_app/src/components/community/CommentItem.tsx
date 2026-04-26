import { Avatar } from 'heroui-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n';
import { useAppTheme, withAlpha } from '../../theme';
import type { CommentResponse } from '../../types';
import { formatRelativeTime } from '../../utils';
import { AppIcon } from '../common/AppIcon';
import { MotionPressable } from '../common/AppMotion';

import {
  getUserAvatarFallback,
  resolveCommunityAssetUrl,
} from './communityUtils';

export interface CommentItemProps {
  comment: CommentResponse;
  replies: CommentResponse[];
  currentUserId: string | null;
  isLoadingReplies?: boolean;
  isLast?: boolean;
  presentation?: 'card' | 'plain';
  onPressUser: (userId: string) => void;
  onReply: (comment: CommentResponse) => void;
  onDelete: (commentId: string) => void;
  onToggleLike: (comment: CommentResponse) => void;
  onLoadReplies: (commentId: string) => void;
}

const MAX_VISIBLE_REPLIES = 3;

function CommentActionButton({
  icon,
  label,
  color,
  active = false,
  onPress,
}: {
  icon: 'heart' | 'heart-filled' | 'message-square' | 'trash';
  label: string;
  color: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const textColor = active ? color : palette.textMuted;

  return (
    <MotionPressable
      accessibilityRole="button"
      className="rounded-full px-2.5 py-1.5"
      pressedScale={0.96}
      onPress={onPress}
      style={{ backgroundColor: active ? withAlpha(color, 0.1) : 'transparent' }}>
      <View className="flex-row items-center gap-1.5">
        <AppIcon color={textColor} name={icon} size={13} />
        <Text className={`${typography.bodySmall} font-medium`} style={{ color: textColor }}>
          {label}
        </Text>
      </View>
    </MotionPressable>
  );
}

function CommentBubble({
  comment,
  nested,
  isOwnComment,
  presentation,
  onPressUser,
  onReply,
  onDelete,
  onToggleLike,
}: {
  comment: CommentResponse;
  nested: boolean;
  isOwnComment: boolean;
  presentation: 'card' | 'plain';
  onPressUser: (userId: string) => void;
  onReply: (comment: CommentResponse) => void;
  onDelete: (commentId: string) => void;
  onToggleLike: (comment: CommentResponse) => void;
}) {
  const { palette, typography } = useAppTheme();
  const { isEnglish, t } = useI18n();
  const avatarUri = resolveCommunityAssetUrl(comment.authorAvatar);
  const isLiked = comment.isLiked ?? comment.liked ?? false;
  const commentClassName = nested
    ? 'py-1'
    : presentation === 'plain'
      ? 'px-0 py-3'
      : 'rounded-xl bg-content1 px-3 py-2';

  return (
    <View className={commentClassName}>
      <View className="flex-row items-start gap-2">
        <Pressable onPress={() => onPressUser(comment.userId)}>
          <Avatar alt={`${comment.authorNickname} 的头像`} color="accent" size="sm">
            {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
            <Avatar.Fallback>{getUserAvatarFallback(comment.authorNickname)}</Avatar.Fallback>
          </Avatar>
        </Pressable>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Pressable className="min-w-0 shrink flex-row items-center gap-1" onPress={() => onPressUser(comment.userId)}>
              <Text className={`${typography.bodySmall} font-medium text-foreground`} numberOfLines={1}>
                {comment.authorNickname}
              </Text>
              {nested && comment.replyToNickname ? (
                <Text
                  className={typography.bodySmall}
                  numberOfLines={1}
                  style={{ color: palette.primary, fontWeight: '700' }}>
                  {isEnglish ? `replying to ${comment.replyToNickname}` : `回复 ${comment.replyToNickname}`}
                </Text>
              ) : null}
              <Text className={`${typography.bodySmall} text-foreground/40`}>
                · {formatRelativeTime(comment.createdAt)}
              </Text>
            </Pressable>
            {isOwnComment ? (
              <View className="ml-auto">
                <CommentActionButton
                  color={palette.danger}
                  icon="trash"
                  label={t('删除')}
                  onPress={() => onDelete(comment.id)}
                />
              </View>
            ) : null}
          </View>

          <Text className={`${typography.body} text-foreground/85`}>
            {comment.content}
          </Text>

          <View className="flex-row items-center gap-3 pt-0.5">
            <CommentActionButton
              active={isLiked}
              color={palette.danger}
              icon={isLiked ? 'heart-filled' : 'heart'}
              label={comment.likeCount > 0 ? String(comment.likeCount) : t('点赞')}
              onPress={() => onToggleLike(comment)}
            />
            <CommentActionButton
              color={palette.accent}
              icon="message-square"
              label={t('回复')}
              onPress={() => onReply(comment)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export function CommentItem({
  comment,
  replies,
  currentUserId,
  isLoadingReplies = false,
  isLast = false,
  presentation = 'card',
  onPressUser,
  onReply,
  onDelete,
  onToggleLike,
  onLoadReplies,
}: CommentItemProps) {
  const { palette, typography } = useAppTheme();
  const { isEnglish, t } = useI18n();
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const previousRepliesLengthRef = useRef(replies.length);
  const plainLayout = presentation === 'plain';

  const totalReplies = Math.max(comment.replyCount ?? 0, replies.length);
  const visibleReplies = useMemo(
    () => (showAllReplies ? replies : replies.slice(0, MAX_VISIBLE_REPLIES)),
    [replies, showAllReplies],
  );
  const hasMoreReplies = totalReplies > MAX_VISIBLE_REPLIES || replies.length > MAX_VISIBLE_REPLIES;

  useEffect(() => {
    if (replies.length > previousRepliesLengthRef.current) {
      setRepliesVisible(true);
    }

    previousRepliesLengthRef.current = replies.length;
  }, [replies.length]);

  const handleExpandAll = () => {
    if (totalReplies > replies.length) {
      onLoadReplies(comment.id);
    }
    setShowAllReplies(true);
  };

  const handleCollapseAll = () => {
    setRepliesVisible(false);
    setShowAllReplies(false);
  };

  const handleExpandReplies = () => {
    if (replies.length === 0) {
      onLoadReplies(comment.id);
    }
    setRepliesVisible(true);
  };

  return (
    <View
      className={plainLayout ? 'gap-1' : 'gap-1 pb-2'}
      style={
        plainLayout
          ? {
              borderBottomColor: withAlpha(palette.textSoft, 0.14),
              borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            }
          : undefined
      }>
      <CommentBubble
        comment={comment}
        isOwnComment={currentUserId === comment.userId}
        nested={false}
        presentation={presentation}
        onDelete={onDelete}
        onPressUser={onPressUser}
        onReply={onReply}
        onToggleLike={onToggleLike}
      />

      {repliesVisible && visibleReplies.length > 0 ? (
        <View className="ml-8 border-l-2 border-default-200 pl-3">
          {visibleReplies.map(reply => (
            <CommentBubble
              key={reply.id}
              comment={reply}
              isOwnComment={currentUserId === reply.userId}
              nested
              presentation={presentation}
              onDelete={onDelete}
              onPressUser={onPressUser}
              onReply={onReply}
              onToggleLike={onToggleLike}
            />
          ))}
        </View>
      ) : null}

      {totalReplies > 0 ? (
        <View className="ml-8 flex-row items-center gap-3 pl-3">
          {isLoadingReplies ? (
            <Text className={`${typography.bodySmall} text-foreground/40`}>{t('加载回复中...')}</Text>
          ) : !repliesVisible ? (
            <Pressable onPress={handleExpandReplies}>
              <Text className={typography.bodySmall} style={{ color: palette.primary, fontWeight: '700' }}>
                {isEnglish ? `Expand ${totalReplies} ${t('条回复')}` : `展开 ${totalReplies} 条回复`}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={handleCollapseAll}>
                <Text className={typography.bodySmall} style={{ color: palette.primary, fontWeight: '700' }}>
                  {t('收起回复')}
                </Text>
              </Pressable>
              {hasMoreReplies && !showAllReplies ? (
                <Pressable onPress={handleExpandAll}>
                  <Text className={typography.bodySmall} style={{ color: palette.primary, fontWeight: '700' }}>
                    {isEnglish ? `${t('查看全部')} (${totalReplies})` : `查看全部 (${totalReplies})`}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}
