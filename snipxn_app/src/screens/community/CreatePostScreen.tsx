import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, Spinner } from 'heroui-native';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AppCanvas } from '../../components/common';
import { AppIcon } from '../../components/common/AppIcon';
import {
  APP_CARD_ENTERING,
  APP_LAYOUT_TRANSITION,
  MotionPressable,
} from '../../components/common/AppMotion';
import { getCommunityErrorMessage } from '../../components/community/communityUtils';
import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import type { CommunityStackParamList } from '../../navigation/types';
import { useCommunityStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

type Props = NativeStackScreenProps<CommunityStackParamList, 'CreatePost'>;

const POST_TITLE_MAX_LENGTH = 80;
const POST_CONTENT_MAX_LENGTH = 4000;
const POST_TAGS_MAX_COUNT = 8;

function parsePostTags(value: string): string[] {
  const seenTags = new Set<string>();

  return value
    .split(/[,，、\n]/)
    .map(tag => tag.trim())
    .filter(tag => {
      if (tag.length === 0 || seenTags.has(tag.toLowerCase())) {
        return false;
      }

      seenTags.add(tag.toLowerCase());
      return true;
    })
    .slice(0, POST_TAGS_MAX_COUNT);
}

export function CreatePostScreen({ navigation }: Props) {
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const createPost = useCommunityStore(state => state.createPost);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'warning' | 'danger';
    title: string;
    description: string;
  } | null>(null);

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const parsedTags = useMemo(() => parsePostTags(tags), [tags]);
  const titleError = touched && trimmedTitle.length === 0 ? t('请输入帖子标题') : null;
  const contentError = touched && trimmedContent.length === 0 ? t('请输入帖子正文') : null;

  const handleSubmit = useCallback(async () => {
    setTouched(true);

    if (submitting || trimmedTitle.length === 0 || trimmedContent.length === 0) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const createdPost = await createPost({
        title: trimmedTitle,
        content: trimmedContent,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      navigation.replace('PostDetail', { postId: createdPost.id });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('发布失败'),
        description: getCommunityErrorMessage(error, t('请稍后重试。')),
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    createPost,
    navigation,
    parsedTags,
    submitting,
    t,
    trimmedContent,
    trimmedTitle,
  ]);

  const handleGoBack = useCallback(() => {
    if (!submitting) {
      navigation.goBack();
    }
  }, [navigation, submitting]);

  return (
    <AppCanvas className="flex-1">
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <View className="flex-1">
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={styles.header}>
              <MotionPressable
                accessibilityLabel={t('返回社区')}
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full"
                disabled={submitting}
                style={{ backgroundColor: withAlpha(palette.text, 0.06) }}
                onPress={handleGoBack}>
                <AppIcon color={palette.text} name="arrow-left" size={20} />
              </MotionPressable>
              <Text className={typography.h3} style={{ color: palette.text }}>
                {t('发布帖子')}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom: 120 + Math.max(insets.bottom, 10),
                  paddingHorizontal: isTablet ? 32 : 16,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Animated.View
                entering={APP_CARD_ENTERING}
                layout={APP_LAYOUT_TRANSITION}
                style={[styles.formContainer, isTablet ? styles.tabletFormContainer : undefined]}>
                {feedback ? (
                  <Alert status={feedback.status}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{feedback.title}</Alert.Title>
                      <Alert.Description>{feedback.description}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                      {t('标题')}
                    </Text>
                    <Text className={typography.caption} style={{ color: palette.textMuted }}>
                      {trimmedTitle.length}/{POST_TITLE_MAX_LENGTH}
                    </Text>
                  </View>
                  <TextInput
                    maxLength={POST_TITLE_MAX_LENGTH}
                    placeholder={t('比如：用 React Native 做本地同步的经验')}
                    placeholderTextColor={palette.placeholder}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      {
                        borderColor: titleError ? palette.danger : withAlpha(palette.primary, 0.14),
                        backgroundColor: palette.panelInset,
                        color: palette.text,
                      },
                    ]}
                    value={title}
                    onChangeText={value => {
                      setTitle(value);
                      setFeedback(null);
                    }}
                  />
                  {titleError ? (
                    <Text accessibilityRole="alert" className={typography.caption} style={{ color: palette.danger }}>
                      {titleError}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                      {t('正文')}
                    </Text>
                    <Text className={typography.caption} style={{ color: palette.textMuted }}>
                      {trimmedContent.length}/{POST_CONTENT_MAX_LENGTH}
                    </Text>
                  </View>
                  <TextInput
                    maxLength={POST_CONTENT_MAX_LENGTH}
                    multiline
                    placeholder={t('分享你的思路、代码片段或踩坑记录')}
                    placeholderTextColor={palette.placeholder}
                    style={[
                      styles.input,
                      styles.contentInput,
                      {
                        borderColor: contentError ? palette.danger : withAlpha(palette.primary, 0.14),
                        backgroundColor: palette.panelInset,
                        color: palette.text,
                      },
                    ]}
                    textAlignVertical="top"
                    value={content}
                    onChangeText={value => {
                      setContent(value);
                      setFeedback(null);
                    }}
                  />
                  {contentError ? (
                    <Text accessibilityRole="alert" className={typography.caption} style={{ color: palette.danger }}>
                      {contentError}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-2">
                  <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                    {t('标签（可选）')}
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    placeholder={t('React Native, 同步, SQLite')}
                    placeholderTextColor={palette.placeholder}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      {
                        borderColor: withAlpha(palette.primary, 0.14),
                        backgroundColor: palette.panelInset,
                        color: palette.text,
                      },
                    ]}
                    value={tags}
                    onChangeText={setTags}
                  />
                </View>

                {parsedTags.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {parsedTags.map(tag => (
                      <View
                        key={tag}
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: withAlpha(palette.primary, 0.12) }}>
                        <Text className={typography.caption} style={{ color: palette.primary }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Animated.View>
            </ScrollView>

            <View
              className="border-t px-4 pt-3"
              style={[
                styles.footer,
                {
                  paddingBottom: Math.max(insets.bottom, 10),
                  borderTopColor: palette.border,
                  backgroundColor: palette.surface,
                },
              ]}>
              <View
                className="flex-row gap-3"
                style={isTablet ? styles.tabletFooterActions : undefined}>
                <Button
                  className="flex-1"
                  isDisabled={submitting}
                  variant="outline"
                  onPress={handleGoBack}>
                  {t('取消')}
                </Button>
                <Button
                  className="flex-1"
                  isDisabled={submitting}
                  variant="primary"
                  onPress={() => {
                    void handleSubmit();
                  }}>
                  {submitting ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>{t('发布中...')}</Button.Label>
                    </>
                  ) : (
                    <>
                      <AppIcon color="#FFFFFF" name="send" size={16} />
                      <Button.Label>{t('发布')}</Button.Label>
                    </>
                  )}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppCanvas>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerSpacer: {
    height: 40,
    width: 40,
  },
  header: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 4,
  },
  formContainer: {
    gap: 18,
    width: '100%',
  },
  tabletFormContainer: {
    alignSelf: 'center',
    maxWidth: 680,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contentInput: {
    minHeight: 340,
  },
  footer: {
    elevation: 18,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  tabletFooterActions: {
    alignSelf: 'center',
    maxWidth: 680,
    width: '100%',
  },
});
