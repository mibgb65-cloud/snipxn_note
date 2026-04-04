import { Avatar, Chip } from 'heroui-native';
import { Pressable, Text, View } from 'react-native';

import { useI18n } from '../../i18n';
import { useAppTheme } from '../../theme';
import type { PostListItemResponse } from '../../types';
import { formatRelativeTime } from '../../utils';
import { AppIcon } from '../common/AppIcon';

import { CommunityActionPill } from './CommunityActionPill';
import { getUserAvatarFallback, resolveCommunityAssetUrl } from './communityUtils';

export interface PostCardProps {
  post: PostListItemResponse;
  onPress: () => void;
  onPressAuthor: () => void;
  onPressLike: () => void;
  onPressCollect: () => void;
  onPressComment: () => void;
}

export function PostCard({
  post,
  onPress,
  onPressAuthor,
  onPressLike,
  onPressCollect,
  onPressComment,
}: PostCardProps) {
  const { palette, typography } = useAppTheme();
  const { isEnglish, t } = useI18n();
  const avatarUri = resolveCommunityAssetUrl(post.authorAvatar);
  const visibleTags = post.tags.filter(tag => tag.trim().length > 0).slice(0, 3);
  const extraTagCount = Math.max(post.tags.length - visibleTags.length, 0);

  return (
        <View
          className="overflow-hidden rounded-[20px] border px-4 py-4"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
            shadowOpacity: 0.1,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
          }}>
          <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            className="min-w-0 flex-1 flex-row items-center gap-3"
            onPress={onPressAuthor}>
            <Avatar alt={`${post.authorNickname} 的头像`} color="accent" size="sm">
              {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
              <Avatar.Fallback>{getUserAvatarFallback(post.authorNickname)}</Avatar.Fallback>
            </Avatar>
            <View className="min-w-0 flex-1">
              <Text className={typography.body} numberOfLines={1} style={{ color: palette.text }}>
                {post.authorNickname}
              </Text>
              <Text
                className={typography.caption}
                numberOfLines={1}
                style={{ color: palette.textSoft }}>
                {formatRelativeTime(post.createdAt)}
              </Text>
            </View>
          </Pressable>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
            style={{ backgroundColor: palette.surfaceAlt }}>
            <AppIcon color={palette.accent} name="eye" size={13} />
            <Text className={typography.caption} style={{ color: palette.textSoft }}>
              {isEnglish ? `${t('浏览')} ${post.viewCount}` : `浏览 ${post.viewCount}`}
            </Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" className="mt-4 gap-3" onPress={onPress}>
          <Text className={typography.h3} numberOfLines={2} style={{ color: palette.text }}>
            {post.title}
          </Text>
          <Text className={typography.bodySmall} numberOfLines={3} style={{ color: palette.textSoft }}>
            {post.summary}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {post.language ? (
              <Chip color="accent" size="sm" variant="soft">
                {post.language}
              </Chip>
            ) : null}
            {visibleTags.map(tag => (
              <Chip key={tag} color="default" size="sm" variant="soft">
                {tag}
              </Chip>
            ))}
            {extraTagCount > 0 ? (
              <Chip color="default" size="sm" variant="soft">
                +{extraTagCount}
              </Chip>
            ) : null}
          </View>
        </Pressable>

        <View
          className="mt-4 flex-row flex-wrap items-center gap-2 border-t pt-4"
          style={{ borderTopColor: palette.border }}>
          <CommunityActionPill
            active={post.isLiked}
            activeIcon="heart-filled"
            color={palette.danger}
            icon="heart"
            label={String(post.likeCount)}
            onPress={onPressLike}
          />
          <CommunityActionPill
            active={post.isCollected}
            activeIcon="bookmark-filled"
            color={palette.warning}
            icon="bookmark"
            label={String(post.collectCount)}
            onPress={onPressCollect}
          />
          <CommunityActionPill
            color={palette.accent}
            icon="message-square"
            label={String(post.commentCount)}
            onPress={onPressComment}
          />
          </View>
        </View>
  );
}
