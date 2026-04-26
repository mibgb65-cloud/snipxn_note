import { Button, Chip, Dialog, FieldError, Input, Label, Spinner, TextField } from 'heroui-native';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { API_BASE_URL, noteApi } from '../../api';
import { useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { shareNoteImage } from '../../native/noteImageShare';
import { useShallow } from 'zustand/react/shallow';

import { useCommunityStore, useFolderStore, useNoteStore, useSyncStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Note, Tag } from '../../types';
import { buildSummary, formatRelativeTime } from '../../utils';
import { MotionPressable } from '../common/AppMotion';
import { GlassPanel } from '../common/AppChrome';
import { AppIcon, type AppIconName } from '../common/AppIcon';

type ToolbarDialog = 'language' | 'tags' | 'share' | 'community-confirm' | 'more' | 'move' | null;
type ToolbarAction =
  | 'create-tag'
  | 'toggle-star'
  | 'open-share'
  | 'share-link'
  | 'share-image'
  | 'share-community'
  | 'generate-link'
  | 'cancel-share'
  | 'export'
  | 'delete'
  | 'move'
  | null;

interface RuntimeProcess {
  env?: Record<string, string | undefined>;
}

export interface NoteToolbarProps {
  note: Note;
  title: string;
  language: string;
  tagIds: string[];
  content: string;
  readOnly?: boolean;
  isFullScreen?: boolean;
  isReadMode?: boolean;
  onTitleChange: (title: string) => void;
  onLanguageChange: (language: string) => void;
  onTagIdsChange: (tagIds: string[]) => void;
  onRequestSave: () => Promise<void>;
  onToggleRunner: () => void;
  onToggleAi: () => void;
  onToggleFullScreen?: () => void;
  onToggleReadMode?: () => void;
  isRunnerOpen?: boolean;
  isRunningCode?: boolean;
  isAiOpen?: boolean;
  isAiBusy?: boolean;
  preferCompactLayout?: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash' },
] as const;

function getRuntimeEnv(): Record<string, string | undefined> {
  const runtime = globalThis as typeof globalThis & { process?: RuntimeProcess };
  return runtime.process?.env ?? {};
}

function resolveWebBaseUrl(): string {
  const env = getRuntimeEnv();
  const configuredBaseUrl =
    env.SNIPXN_WEB_BASE_URL ?? env.WEB_BASE_URL ?? env.REACT_NATIVE_WEB_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
}

function buildShareUrl(shareToken: string): string {
  return `${resolveWebBaseUrl()}/share/${shareToken}`;
}

function getShareToken(response: { shareToken?: string | null } | null | undefined): string | null {
  const token = response?.shareToken;
  return typeof token === 'string' && token.trim().length > 0 ? token : null;
}

function normalizeShareLanguage(language: string): string | null {
  const normalizedLanguage = language.trim();
  return normalizedLanguage.length > 0 ? normalizedLanguage : null;
}

function isNoteNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error && typeof error.code === 'number' ? error.code : null;
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const normalizedMessage = message.toLowerCase();

  return (
    code === 404 ||
    message.includes('笔记不存在') ||
    normalizedMessage.includes('note not found') ||
    normalizedMessage.includes('not found')
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return translateLiteral(error.message);
  }

  return fallback;
}

function findTagById(tags: Tag[], tagId: string): Tag | undefined {
  return tags.find(tag => tag.id === tagId);
}

function toggleTagId(tagIds: string[], tagId: string): string[] {
  if (tagIds.includes(tagId)) {
    return tagIds.filter(id => id !== tagId);
  }

  return [...tagIds, tagId];
}

function uniqueNonEmptyStrings(values: string[]): string[] {
  const seenValues = new Set<string>();

  return values
    .map(value => value.trim())
    .filter(value => {
      const normalizedValue = value.toLowerCase();

      if (value.length === 0 || seenValues.has(normalizedValue)) {
        return false;
      }

      seenValues.add(normalizedValue);
      return true;
    });
}

function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function formatToolbarLanguageLabel(language: string): string {
  const normalizedLanguage = language.trim().toLowerCase();

  switch (normalizedLanguage) {
    case 'markdown':
      return 'MD';
    case 'plaintext':
      return 'TXT';
    case 'javascript':
      return 'JS';
    case 'typescript':
      return 'TS';
    case 'python':
      return 'PY';
    case 'kotlin':
      return 'KT';
    case 'cpp':
      return 'CPP';
    case 'json':
      return 'JSON';
    case 'yaml':
      return 'YAML';
    case 'sql':
      return 'SQL';
    case 'bash':
      return 'BASH';
    case 'go':
      return 'GO';
    case 'rust':
      return 'RUST';
    case 'java':
      return 'JAVA';
    default:
      return normalizedLanguage.length > 0 ? normalizedLanguage.toUpperCase() : 'MD';
  }
}

function ToolbarActionChip({
  icon,
  label,
  active = false,
  disabled = false,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();

  return (
    <MotionPressable
      accessibilityRole="button"
      className="rounded-full border px-2 py-1"
      disabled={disabled}
      onPress={onPress}
      style={{
        opacity: disabled ? 0.45 : 1,
        borderColor: active ? withAlpha(palette.primary, 0.36) : palette.border,
        backgroundColor: active ? palette.primarySoft : palette.panelRaised,
      }}>
      <View className="flex-row items-center gap-1">
        <AppIcon color={active ? palette.primary : palette.textMuted} name={icon} size={14} />
        <Text className={typography.bodySmall} style={{ color: palette.text }}>
          {label}
        </Text>
      </View>
    </MotionPressable>
  );
}

function ToolbarDialogHeader({
  icon,
  title,
  subtitle,
  closeLabel,
  onClose,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const { palette, typography } = useAppTheme();

  return (
    <View className="flex-row items-start gap-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: palette.primarySoft }}>
        <AppIcon color={palette.primary} name={icon} size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Dialog.Title>{title}</Dialog.Title>
        {subtitle ? (
          <Text className={`${typography.bodySmall} mt-1`} numberOfLines={2} style={{ color: palette.textSoft }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <MotionPressable
        accessibilityLabel={closeLabel}
        accessibilityRole="button"
        className="h-9 w-9 items-center justify-center rounded-full"
        onPress={onClose}
        style={{ backgroundColor: palette.panelInset }}>
        <AppIcon color={palette.textMuted} name="x" size={17} />
      </MotionPressable>
    </View>
  );
}

function DialogErrorBanner({ message }: { message: string }) {
  const { palette, typography } = useAppTheme();

  return (
    <View
      className="flex-row items-center gap-2 rounded-[10px] px-3 py-2.5"
      style={{ backgroundColor: withAlpha(palette.danger, 0.12) }}>
      <AppIcon color={palette.danger} name="alert-circle" size={16} />
      <Text className={`${typography.bodySmall} min-w-0 flex-1`} style={{ color: palette.danger }}>
        {message}
      </Text>
    </View>
  );
}

function DialogSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { palette, typography } = useAppTheme();

  return (
    <View className="gap-2.5">
      <Text className={typography.caption} style={{ color: palette.textSoft }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function DialogActionRow({
  icon,
  title,
  detail,
  tone = 'default',
  disabled = false,
  loading = false,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  detail?: string;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const toneColor =
    tone === 'danger' ? palette.danger : tone === 'primary' ? palette.primary : palette.textMuted;
  const backgroundColor =
    tone === 'danger'
      ? withAlpha(palette.danger, 0.08)
      : tone === 'primary'
        ? palette.primarySoft
        : palette.panelRaised;

  return (
    <MotionPressable
      accessibilityRole="button"
      className="rounded-[10px] border px-3.5 py-3"
      disabled={disabled}
      onPress={onPress}
      style={{
        opacity: disabled ? 0.48 : 1,
        borderColor: withAlpha(toneColor, tone === 'default' ? 0.16 : 0.24),
        backgroundColor,
      }}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: withAlpha(toneColor, tone === 'default' ? 0.1 : 0.14) }}>
          <AppIcon color={toneColor} name={icon} size={17} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className={`${typography.body} font-semibold`} numberOfLines={1} style={{ color: palette.text }}>
            {title}
          </Text>
          {detail ? (
            <Text className={typography.caption} numberOfLines={1} style={{ color: palette.textSoft }}>
              {detail}
            </Text>
          ) : null}
        </View>
        {loading ? (
          <Spinner color="default" size="sm" />
        ) : (
          <AppIcon color={palette.textSoft} name="chevron-right" size={17} />
        )}
      </View>
    </MotionPressable>
  );
}

function TagOptionPill({
  tag,
  selected,
  onPress,
}: {
  tag: Tag;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const tagColor = isHexColor(tag.color) ? tag.color.trim() : palette.primary;

  return (
    <MotionPressable
      accessibilityRole="button"
      className="rounded-full border px-3 py-2"
      onPress={onPress}
      style={{
        borderColor: selected ? withAlpha(tagColor, 0.42) : palette.border,
        backgroundColor: selected ? withAlpha(tagColor, 0.12) : palette.panelRaised,
      }}>
      <View className="flex-row items-center gap-2">
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: tagColor }}
        />
        <Text className={typography.bodySmall} numberOfLines={1} style={{ color: palette.text }}>
          {tag.name}
        </Text>
        {selected ? <AppIcon color={tagColor} name="check-circle" size={14} /> : null}
      </View>
    </MotionPressable>
  );
}

export function NoteToolbar({
  note,
  title,
  language,
  tagIds,
  content,
  readOnly = false,
  isFullScreen = false,
  isReadMode = false,
  onTitleChange,
  onLanguageChange,
  onTagIdsChange,
  onRequestSave,
  onToggleRunner,
  onToggleAi,
  onToggleFullScreen,
  onToggleReadMode,
  isRunnerOpen = false,
  isRunningCode = false,
  isAiOpen = false,
  isAiBusy = false,
  preferCompactLayout = false,
}: NoteToolbarProps) {
  const navigation = useNavigation<any>();
  const { isTablet, showSidebar } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const { height: windowHeight } = useWindowDimensions();
  const useCompactLayout = preferCompactLayout || !showSidebar;
  const dialogMaxHeight = Math.max(420, Math.floor(windowHeight * 0.82));

  const { tags, createTag, toggleStar, updateNote, deleteNote } = useNoteStore(useShallow(state => ({
    tags: state.tags,
    createTag: state.createTag,
    toggleStar: state.toggleStar,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
  })));
  const pushNow = useSyncStore(state => state.pushNow);
  const createPost = useCommunityStore(state => state.createPost);
  const folders = useFolderStore(state => state.folders);

  const [activeDialog, setActiveDialog] = useState<ToolbarDialog>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ToolbarAction>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('');
  const [tagNameTouched, setTagNameTouched] = useState(false);
  const [tagColorTouched, setTagColorTouched] = useState(false);

  const selectedTags = useMemo(
    () => tagIds.map(tagId => findTagById(tags, tagId)).filter((tag): tag is Tag => Boolean(tag)),
    [tagIds, tags],
  );
  const moveTargets = useMemo(
    () => folders.filter(folder => folder.id !== note.folderId),
    [folders, note.folderId],
  );

  const newTagNameError = tagNameTouched && newTagName.trim().length === 0 ? t('请输入标签名称') : null;
  const newTagColorError =
    tagColorTouched && newTagColor.trim().length > 0 && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(newTagColor.trim())
      ? t('颜色需为十六进制，例如 #22C55E')
      : null;
  const previewTagColor = isHexColor(newTagColor) ? newTagColor.trim() : palette.primary;

  const closeDialogs = () => {
    setActiveDialog(null);
    setActionLoading(false);
    setActiveAction(null);
    setToolbarError(null);
    setTagNameTouched(false);
    setTagColorTouched(false);
  };

  const handleSelectLanguage = (nextLanguage: string) => {
    onLanguageChange(nextLanguage);
    setToolbarError(null);
    closeDialogs();
  };

  const handleToggleTag = (tagId: string) => {
    onTagIdsChange(toggleTagId(tagIds, tagId));
    setToolbarError(null);
  };

  const handleCreateTag = async () => {
    setTagNameTouched(true);
    setTagColorTouched(true);
    setToolbarError(null);

    if (newTagName.trim().length === 0 || newTagColorError) {
      return;
    }

    setActionLoading(true);
    setActiveAction('create-tag');

    try {
      const normalizedName = newTagName.trim();
      const normalizedColor = newTagColor.trim().length > 0 ? newTagColor.trim() : undefined;

      await createTag(normalizedName, normalizedColor);
      const createdTag = useNoteStore
        .getState()
        .tags.find(
          tag => tag.name === normalizedName && (tag.color ?? null) === (normalizedColor ?? null),
        );

      if (createdTag && !tagIds.includes(createdTag.id)) {
        onTagIdsChange([...tagIds, createdTag.id]);
      }

      setNewTagName('');
      setNewTagColor('');
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('创建标签失败，请稍后重试。')));
    }
  };

  const handleToggleStar = async () => {
    setActionLoading(true);
    setActiveAction('toggle-star');
    setToolbarError(null);

    try {
      await toggleStar(note.id);
      setActionLoading(false);
      setActiveAction(null);
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('更新星标状态失败，请稍后重试。')));
    }
  };

  const ensureNoteReadyForPublicShare = async (forceLocalDirty = false) => {
    await onRequestSave();

    if (forceLocalDirty) {
      await updateNote(note.id, {
        title: title.trim().length > 0 ? title.trim() : t('无标题笔记'),
        content,
        primaryLanguage: normalizeShareLanguage(language),
        tagIds: [...tagIds],
      });
    }

    const syncResult = await pushNow();

    if (syncResult.status === 'success') {
      return;
    }

    if (syncResult.status === 'already_syncing') {
      throw new Error(t('笔记正在同步，请稍后再分享。'));
    }

    if (syncResult.status === 'offline') {
      throw new Error(t('当前离线，无法生成公开分享链接。'));
    }

    if (syncResult.status === 'auth_error') {
      throw new Error(t('登录状态已失效，请重新登录。'));
    }

    throw new Error(syncResult.message ?? t('同步失败'));
  };

  const requestShareNote = async () => {
    await ensureNoteReadyForPublicShare();

    try {
      return await noteApi.shareNote(note.id);
    } catch (error) {
      if (!isNoteNotFoundError(error)) {
        throw error;
      }

      await ensureNoteReadyForPublicShare(true);
      return noteApi.shareNote(note.id);
    }
  };

  const requestShareStatus = async () => {
    await ensureNoteReadyForPublicShare();

    try {
      return await noteApi.getShareStatus(note.id);
    } catch (error) {
      if (!isNoteNotFoundError(error)) {
        throw error;
      }

      await ensureNoteReadyForPublicShare(true);
      return noteApi.getShareStatus(note.id);
    }
  };

  const ensureNoteReadyForCommunityShare = async () => {
    await onRequestSave();

    const syncResult = await pushNow();

    if (syncResult.status === 'success') {
      return;
    }

    if (syncResult.status === 'already_syncing') {
      throw new Error(t('笔记正在同步，请稍后再发布到社区。'));
    }

    if (syncResult.status === 'offline') {
      throw new Error(t('当前离线，无法发布到社区。'));
    }

    if (syncResult.status === 'auth_error') {
      throw new Error(t('登录状态已失效，请重新登录。'));
    }

    throw new Error(syncResult.message ?? t('同步失败'));
  };

  const navigateToCommunityPost = (postId: string) => {
    const parentNavigation = typeof navigation.getParent === 'function' ? navigation.getParent() : null;
    const communityRouteName = isTablet ? 'Community' : 'CommunityTab';

    if (parentNavigation && typeof parentNavigation.navigate === 'function') {
      parentNavigation.navigate(communityRouteName, {
        screen: 'PostDetail',
        params: { postId },
      });
      return;
    }

    navigation.navigate('PostDetail', { postId });
  };

  const handleShareNote = async () => {
    setActionLoading(true);
    setActiveAction('share-link');
    setToolbarError(null);

    try {
      const result = await requestShareNote();
      const nextShareToken = getShareToken(result);

      if (!nextShareToken) {
        throw new Error(t('生成分享链接失败，请稍后重试。'));
      }

      const resolvedTitle = title.trim().length > 0 ? title.trim() : t('无标题笔记');
      setShareToken(nextShareToken);
      await Share.share({
        title: resolvedTitle,
        message: buildShareUrl(nextShareToken),
      });
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('分享笔记失败，请稍后重试。')));
    }
  };

  const openShareDialog = async () => {
    setActionLoading(true);
    setActiveAction('open-share');
    setToolbarError(null);
    setActiveDialog('share');

    try {
      const result = await requestShareStatus();
      setShareToken(getShareToken(result));
      setActionLoading(false);
      setActiveAction(null);
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('获取分享状态失败，请稍后重试。')));
      setActiveDialog('share');
    }
  };

  const handleGenerateShare = async () => {
    setActionLoading(true);
    setActiveAction('generate-link');
    setToolbarError(null);

    try {
      const result = await requestShareNote();
      const nextShareToken = getShareToken(result);

      if (!nextShareToken) {
        throw new Error(t('生成分享链接失败，请稍后重试。'));
      }

      setShareToken(nextShareToken);
      setActionLoading(false);
      setActiveAction(null);
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('生成分享链接失败，请稍后重试。')));
    }
  };

  const handleCancelShare = async () => {
    setActionLoading(true);
    setActiveAction('cancel-share');
    setToolbarError(null);

    try {
      await noteApi.cancelShare(note.id);
      setShareToken(null);
      setActionLoading(false);
      setActiveAction(null);
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('取消分享失败，请稍后重试。')));
    }
  };

  const handleShareImage = async () => {
    setActionLoading(true);
    setActiveAction('share-image');
    setToolbarError(null);

    try {
      const result = await requestShareNote();
      const nextShareToken = getShareToken(result);

      if (!nextShareToken) {
        throw new Error(t('生成分享链接失败，请稍后重试。'));
      }

      const nextShareUrl = buildShareUrl(nextShareToken);
      const resolvedTitle = title.trim().length > 0 ? title.trim() : t('无标题笔记');
      setShareToken(nextShareToken);
      await shareNoteImage({
        title: resolvedTitle,
        summary: buildSummary(content),
        language: formatToolbarLanguageLabel(language),
        updatedAt: formatRelativeTime(note.updatedAt),
        shareUrl: nextShareUrl,
        brand: 'Snipxn',
        footer: t('Generated from Snipxn Workspace'),
        qrLabel: t('扫码打开分享链接'),
        chooserTitle: t('分享为图片'),
      });
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('图片分享失败，请稍后重试。')));
    }
  };

  const openCommunityConfirmDialog = () => {
    setToolbarError(null);
    setActiveAction(null);

    if (content.trim().length === 0) {
      setToolbarError(t('当前笔记内容为空，无法发布到社区。'));
      return;
    }

    setActiveDialog('community-confirm');
  };

  const handleShareCommunity = async () => {
    const trimmedContent = content.trim();

    setActionLoading(true);
    setActiveAction('share-community');
    setToolbarError(null);

    if (trimmedContent.length === 0) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(t('当前笔记内容为空，无法发布到社区。'));
      return;
    }

    try {
      await ensureNoteReadyForCommunityShare();

      const communityTags = uniqueNonEmptyStrings(
        selectedTags.length > 0 ? selectedTags.map(tag => tag.name) : tagIds,
      );
      const createdPost = await createPost({
        title: title.trim().length > 0 ? title.trim() : t('无标题笔记'),
        content,
        language: normalizeShareLanguage(language) ?? undefined,
        tags: communityTags.length > 0 ? communityTags : undefined,
        originNoteId: note.id,
      });

      closeDialogs();
      navigateToCommunityPost(createdPost.id);
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('发布到社区失败，请稍后重试。')));
    }
  };

  const handleExport = async () => {
    setActionLoading(true);
    setActiveAction('export');
    setToolbarError(null);

    try {
      await onRequestSave();
      const resolvedTitle = title.trim().length > 0 ? title.trim() : t('无标题笔记');
      await Share.share({
        title: resolvedTitle,
        message: `${resolvedTitle}\n\n${content}`,
      });
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('导出笔记失败，请稍后重试。')));
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    setActiveAction('delete');
    setToolbarError(null);

    try {
      await onRequestSave();
      await deleteNote(note.id);
      closeDialogs();

      if (useCompactLayout && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('删除笔记失败，请稍后重试。')));
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    setActionLoading(true);
    setActiveAction('move');
    setToolbarError(null);

    try {
      await onRequestSave();
      await updateNote(note.id, { folderId });
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
      setActiveAction(null);
      setToolbarError(getErrorMessage(error, t('移动笔记失败，请稍后重试。')));
    }
  };

  return (
    <View className="mb-1.5 gap-1">
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <TextInput
            className={`${useCompactLayout ? 'text-lg' : isTablet ? 'text-xl' : 'text-lg'} font-bold`}
            editable={!readOnly}
            onChangeText={onTitleChange}
            placeholder={t('无标题笔记')}
            placeholderTextColor={palette.placeholder}
            style={{ color: palette.text, paddingVertical: 0 }}
            value={title}
          />
        </View>
        {onToggleReadMode ? (
          <MotionPressable
            accessibilityLabel={isReadMode ? t('编辑模式') : t('阅读模式')}
            accessibilityRole="button"
            className="shrink-0 rounded-[8px] border px-2 py-1.5"
            onPress={onToggleReadMode}
            style={{
              borderColor: withAlpha(palette.primary, 0.2),
              backgroundColor: isReadMode ? palette.primarySoft : palette.panelRaised,
            }}>
            <AppIcon
              color={isReadMode ? palette.primary : palette.text}
              name={isReadMode ? 'eye' : 'edit-3'}
              size={16}
            />
          </MotionPressable>
        ) : null}
        {onToggleFullScreen ? (
          <MotionPressable
            accessibilityLabel={isFullScreen ? t('退出全屏编辑') : t('进入全屏编辑')}
            accessibilityRole="button"
            className="shrink-0 rounded-[8px] border px-2.5 py-1.5"
            onPress={onToggleFullScreen}
            style={{
              borderColor: withAlpha(palette.primary, 0.2),
              backgroundColor: isFullScreen ? palette.primarySoft : palette.panelRaised,
            }}>
            <Text className={typography.bodySmall} style={{ color: isFullScreen ? palette.primary : palette.text }}>
              {isFullScreen ? t('退出全屏') : t('全屏编辑')}
            </Text>
          </MotionPressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        className="flex-none"
        showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1 pr-0.5">
          <ToolbarActionChip
            disabled={readOnly}
            icon="code"
            label={formatToolbarLanguageLabel(language || 'markdown')}
            onPress={() => {
              setToolbarError(null);
              setActiveDialog('language');
            }}
          />
          <ToolbarActionChip
            disabled={readOnly}
            icon="tag"
            label={t('标签')}
            onPress={() => {
              setToolbarError(null);
              setActiveDialog('tags');
            }}
          />
          <ToolbarActionChip
            active={note.isStarred}
            disabled={readOnly || actionLoading}
            icon={note.isStarred ? 'star-filled' : 'star'}
            label={t('收藏')}
            onPress={() => {
              void handleToggleStar();
            }}
          />
          <ToolbarActionChip
            active={isAiOpen || isAiBusy}
            icon="sparkles"
            label={isAiBusy ? t('处理中') : t('AI 辅助')}
            onPress={onToggleAi}
          />
          <ToolbarActionChip
            active={isRunnerOpen || isRunningCode}
            icon="play"
            label={isRunningCode ? t('运行中') : t('运行')}
            onPress={onToggleRunner}
          />
          <ToolbarActionChip
            disabled={actionLoading}
            icon="share"
            label={t('分享')}
            onPress={() => {
              void openShareDialog();
            }}
          />
          <ToolbarActionChip
            disabled={actionLoading}
            icon="more"
            label={t('更多')}
            onPress={() => {
              setToolbarError(null);
              setActiveDialog('more');
            }}
          />
        </View>
      </ScrollView>

      {selectedTags.length > 0 ? (
        <ScrollView horizontal className="flex-none" showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1">
            {selectedTags.map(tag => (
              <Chip key={tag.id} color="default" size="sm" variant="soft">
                {tag.name}
              </Chip>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {toolbarError ? (
        <View
          className="flex-row items-center gap-2 rounded-2xl px-3 py-2"
          style={{ backgroundColor: withAlpha(palette.danger, 0.12) }}>
          <AppIcon color={palette.danger} name="alert-circle" size={15} />
          <Text className={typography.bodySmall} style={{ color: palette.danger }}>
            {toolbarError}
          </Text>
        </View>
      ) : null}

      <Dialog isOpen={activeDialog === 'language'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-4">
                <Dialog.Title>{t('选择语言')}</Dialog.Title>
                <ScrollView className="max-h-80">
                  <View className="gap-2">
                    {LANGUAGE_OPTIONS.map(option => (
                      <Button
                        key={option.value}
                        variant={language === option.value ? 'primary' : 'outline'}
                        onPress={() => handleSelectLanguage(option.value)}>
                        {option.label}
                      </Button>
                    ))}
                  </View>
                </ScrollView>
                <Button variant="ghost" onPress={closeDialogs}>
                  {t('关闭')}
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'tags'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            className="mx-4 rounded-[12px] p-0"
            style={{
              alignSelf: 'center',
              backgroundColor: 'transparent',
              width: isTablet ? 500 : undefined,
            }}>
            <GlassPanel
              className="px-4 py-4"
              highlight={palette.primary}
              style={{ maxHeight: dialogMaxHeight }}
              variant="strong">
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  <ToolbarDialogHeader
                    closeLabel={t('关闭')}
                    icon="tag"
                    onClose={closeDialogs}
                    subtitle={t('为这篇笔记选择或新建标签。')}
                    title={t('管理标签')}
                  />

                  {toolbarError ? <DialogErrorBanner message={toolbarError} /> : null}

                  <View
                    className="flex-row items-center justify-between rounded-[10px] border px-3.5 py-3"
                    style={{
                      borderColor: withAlpha(palette.primary, 0.2),
                      backgroundColor: palette.panelInset,
                    }}>
                    <View className="flex-row items-center gap-2">
                      <AppIcon color={palette.primary} name="check-circle" size={16} />
                      <Text className={typography.bodySmall} style={{ color: palette.textMuted }}>
                        {t('已选标签')}
                      </Text>
                    </View>
                    <Text className={`${typography.body} font-semibold`} style={{ color: palette.text }}>
                      {selectedTags.length}
                    </Text>
                  </View>

                  <DialogSection title={t('可用标签')}>
                    {tags.length > 0 ? (
                      <View className="flex-row flex-wrap gap-2">
                        {tags.map(tag => (
                          <TagOptionPill
                            key={tag.id}
                            selected={tagIds.includes(tag.id)}
                            tag={tag}
                            onPress={() => handleToggleTag(tag.id)}
                          />
                        ))}
                      </View>
                    ) : (
                      <View
                        className="items-center gap-2 rounded-[10px] border px-4 py-5"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.panelInset,
                        }}>
                        <AppIcon color={palette.textSoft} name="tag" size={20} />
                        <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                          {t('暂无标签，先创建一个。')}
                        </Text>
                      </View>
                    )}
                  </DialogSection>

                  <DialogSection title={t('新建标签')}>
                    <View className="gap-3 border-t pt-3" style={{ borderColor: palette.border }}>
                      <TextField isRequired isInvalid={newTagNameError !== null}>
                        <Label>{t('标签名称')}</Label>
                        <Input
                          placeholder={t('例如 React Native')}
                          value={newTagName}
                          onBlur={() => setTagNameTouched(true)}
                          onChangeText={value => {
                            setNewTagName(value);
                            setToolbarError(null);
                          }}
                        />
                        <FieldError>{newTagNameError ?? ''}</FieldError>
                      </TextField>
                      <TextField isInvalid={newTagColorError !== null}>
                        <Label>{t('标签颜色')}</Label>
                        <Input
                          autoCapitalize="none"
                          placeholder="#22C55E"
                          value={newTagColor}
                          onBlur={() => setTagColorTouched(true)}
                          onChangeText={value => {
                            setNewTagColor(value);
                            setToolbarError(null);
                          }}
                        />
                        <FieldError>{newTagColorError ?? ''}</FieldError>
                      </TextField>
                      <View className="flex-row items-center gap-2">
                        <View
                          className="h-7 w-7 rounded-full border"
                          style={{
                            borderColor: withAlpha(previewTagColor, 0.34),
                            backgroundColor: previewTagColor,
                          }}
                        />
                        <Text className={typography.caption} style={{ color: palette.textSoft }}>
                          {newTagColor.trim().length > 0
                            ? t('颜色预览')
                            : t('留空将使用默认颜色')}
                        </Text>
                      </View>
                      <Button
                        isDisabled={actionLoading}
                        variant="primary"
                        onPress={() => void handleCreateTag()}>
                        {activeAction === 'create-tag' && actionLoading ? (
                          <>
                            <Spinner color="default" size="sm" />
                            <Button.Label>{t('创建中...')}</Button.Label>
                          </>
                        ) : (
                          t('创建并选中')
                        )}
                      </Button>
                    </View>
                  </DialogSection>

                  <Button variant="ghost" onPress={closeDialogs}>
                    {t('完成')}
                  </Button>
                </View>
              </ScrollView>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'share'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            className="mx-4 rounded-[12px] p-0"
            style={{
              alignSelf: 'center',
              backgroundColor: 'transparent',
              width: isTablet ? 500 : undefined,
            }}>
            <GlassPanel
              className="px-4 py-4"
              highlight={palette.primary}
              style={{ maxHeight: dialogMaxHeight }}
              variant="strong">
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                <ToolbarDialogHeader
                  closeLabel={t('关闭')}
                  icon="share"
                  onClose={closeDialogs}
                  subtitle={title.trim().length > 0 ? title.trim() : t('无标题笔记')}
                  title={t('分享笔记')}
                />

                {toolbarError ? <DialogErrorBanner message={toolbarError} /> : null}

                {activeAction === 'open-share' && actionLoading ? (
                  <View
                    className="flex-row items-center gap-2 rounded-[10px] px-3 py-2.5"
                    style={{ backgroundColor: palette.panelInset }}>
                    <Spinner color="default" size="sm" />
                    <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                      {t('正在同步分享状态...')}
                    </Text>
                  </View>
                ) : null}

                <DialogSection title={t('选择分享方式')}>
                  <View className="gap-2">
                    <DialogActionRow
                      detail={t('系统分享')}
                      disabled={actionLoading}
                      icon="share"
                      loading={activeAction === 'share-link' && actionLoading}
                      onPress={() => void handleShareNote()}
                      title={t('分享链接')}
                      tone="primary"
                    />
                    <DialogActionRow
                      detail={t('图片卡片')}
                      disabled={actionLoading}
                      icon="upload"
                      loading={activeAction === 'share-image' && actionLoading}
                      onPress={() => void handleShareImage()}
                      title={t('分享为图片')}
                    />
                    <DialogActionRow
                      detail={t('社区帖子')}
                      disabled={actionLoading}
                      icon="community"
                      loading={activeAction === 'share-community' && actionLoading}
                      onPress={openCommunityConfirmDialog}
                      title={t('分享到社区')}
                    />
                    <DialogActionRow
                      detail={t('Markdown 文本')}
                      disabled={actionLoading}
                      icon="notes"
                      loading={activeAction === 'export' && actionLoading}
                      onPress={() => void handleExport()}
                      title={t('导出 Markdown')}
                    />
                  </View>
                </DialogSection>

                <DialogSection title={t('公开链接管理')}>
                  <View className="gap-3 border-t pt-3" style={{ borderColor: palette.border }}>
                    <View className="flex-row items-center gap-3">
                      <View
                        className="h-9 w-9 items-center justify-center rounded-[8px]"
                        style={{
                          backgroundColor: shareToken
                            ? withAlpha(palette.success, 0.12)
                            : withAlpha(palette.textSoft, 0.1),
                        }}>
                        <AppIcon
                          color={shareToken ? palette.success : palette.textSoft}
                          name={shareToken ? 'check-circle' : 'info'}
                          size={17}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className={`${typography.body} font-semibold`} style={{ color: palette.text }}>
                          {shareToken ? t('公开链接已生成') : t('公开链接未生成')}
                        </Text>
                        <Text className={typography.caption} style={{ color: palette.textSoft }}>
                          {shareToken ? t('链接可在网页端打开') : t('生成后可复制或撤销')}
                        </Text>
                      </View>
                    </View>

                    {shareToken ? (
                      <View
                        className="rounded-[8px] border px-3 py-2.5"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.panelInset,
                        }}>
                        <Text
                          className={typography.caption}
                          numberOfLines={2}
                          selectable
                          style={{ color: palette.textMuted }}>
                          {buildShareUrl(shareToken)}
                        </Text>
                      </View>
                    ) : (
                      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                        {t('还没有生成分享链接。')}
                      </Text>
                    )}

                    {shareToken ? (
                      <Button
                        isDisabled={actionLoading}
                        variant="danger"
                        onPress={() => void handleCancelShare()}>
                        {activeAction === 'cancel-share' && actionLoading ? (
                          <>
                            <Spinner color="default" size="sm" />
                            <Button.Label>{t('处理中...')}</Button.Label>
                          </>
                        ) : (
                          t('取消分享')
                        )}
                      </Button>
                    ) : (
                      <Button
                        isDisabled={actionLoading}
                        variant="primary"
                        onPress={() => void handleGenerateShare()}>
                        {activeAction === 'generate-link' && actionLoading ? (
                          <>
                            <Spinner color="default" size="sm" />
                            <Button.Label>{t('生成中...')}</Button.Label>
                          </>
                        ) : (
                          t('生成分享链接')
                        )}
                      </Button>
                    )}
                  </View>
                </DialogSection>

                <Button isDisabled={actionLoading} variant="ghost" onPress={closeDialogs}>
                  {t('关闭')}
                </Button>
                </View>
              </ScrollView>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        isOpen={activeDialog === 'community-confirm'}
        onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            className="mx-4 rounded-[12px] p-0"
            style={{
              alignSelf: 'center',
              backgroundColor: 'transparent',
              width: isTablet ? 460 : undefined,
            }}>
            <GlassPanel className="px-4 py-4" highlight={palette.primary} variant="strong">
              <View className="gap-4">
                <ToolbarDialogHeader
                  closeLabel={t('关闭')}
                  icon="community"
                  onClose={closeDialogs}
                  subtitle={title.trim().length > 0 ? title.trim() : t('无标题笔记')}
                  title={t('确认分享到社区')}
                />

                {toolbarError ? <DialogErrorBanner message={toolbarError} /> : null}

                <View
                  className="rounded-[10px] border px-3.5 py-3"
                  style={{
                    borderColor: withAlpha(palette.primary, 0.2),
                    backgroundColor: palette.panelInset,
                  }}>
                  <View className="flex-row gap-3">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-[8px]"
                      style={{ backgroundColor: palette.primarySoft }}>
                      <AppIcon color={palette.primary} name="info" size={17} />
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className={`${typography.body} font-semibold`} style={{ color: palette.text }}>
                        {t('发布前确认')}
                      </Text>
                      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                        {t('发布后，社区用户将可以看到这篇笔记的标题、正文和标签。')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="gap-2">
                  <Button
                    isDisabled={actionLoading}
                    variant="primary"
                    onPress={() => void handleShareCommunity()}>
                    {activeAction === 'share-community' && actionLoading ? (
                      <>
                        <Spinner color="default" size="sm" />
                        <Button.Label>{t('发布中...')}</Button.Label>
                      </>
                    ) : (
                      t('确认发布')
                    )}
                  </Button>
                  <Button
                    isDisabled={actionLoading}
                    variant="ghost"
                    onPress={() => {
                      setToolbarError(null);
                      setActiveDialog('share');
                    }}>
                    {t('再想想')}
                  </Button>
                </View>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'more'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            className="mx-4 rounded-[12px] p-0"
            style={{
              alignSelf: 'center',
              backgroundColor: 'transparent',
              width: isTablet ? 440 : undefined,
            }}>
            <GlassPanel
              className="px-4 py-4"
              highlight={palette.primary}
              style={{ maxHeight: dialogMaxHeight }}
              variant="strong">
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                <ToolbarDialogHeader
                  closeLabel={t('关闭')}
                  icon="more"
                  onClose={closeDialogs}
                  subtitle={title.trim().length > 0 ? title.trim() : t('无标题笔记')}
                  title={t('更多操作')}
                />

                {toolbarError ? <DialogErrorBanner message={toolbarError} /> : null}

                <DialogSection title={t('分享与导出')}>
                  <View className="gap-2">
                    <DialogActionRow
                      detail={t('公开链接管理')}
                      disabled={actionLoading}
                      icon="share"
                      loading={activeAction === 'open-share' && actionLoading}
                      onPress={() => {
                        void openShareDialog();
                      }}
                      title={t('管理分享')}
                      tone="primary"
                    />
                    <DialogActionRow
                      detail={t('图片卡片')}
                      disabled={actionLoading}
                      icon="upload"
                      loading={activeAction === 'share-image' && actionLoading}
                      onPress={() => void handleShareImage()}
                      title={t('分享为图片')}
                    />
                    <DialogActionRow
                      detail={t('Markdown 文本')}
                      disabled={actionLoading}
                      icon="notes"
                      loading={activeAction === 'export' && actionLoading}
                      onPress={() => void handleExport()}
                      title={t('导出')}
                    />
                  </View>
                </DialogSection>

                <DialogSection title={t('整理')}>
                  <DialogActionRow
                    detail={moveTargets.length === 0 ? t('暂无可移动的目标文件夹。') : t('移动到文件夹')}
                    disabled={actionLoading || moveTargets.length === 0 || readOnly}
                    icon="folder"
                    onPress={() => {
                      setToolbarError(null);
                      setActiveDialog('move');
                    }}
                    title={t('移动到文件夹')}
                  />
                </DialogSection>

                <DialogSection title={t('危险操作')}>
                  <DialogActionRow
                    disabled={actionLoading}
                    icon="trash"
                    loading={activeAction === 'delete' && actionLoading}
                    onPress={() => void handleDelete()}
                    title={t('删除')}
                    tone="danger"
                  />
                </DialogSection>

                <Button isDisabled={actionLoading} variant="ghost" onPress={closeDialogs}>
                  {t('取消')}
                </Button>
                </View>
              </ScrollView>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'move'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-6" style={{ backgroundColor: palette.surface }}>
            <View className="gap-4">
              <Dialog.Title>{t('移动到文件夹')}</Dialog.Title>
              <ScrollView className="max-h-72">
                <View className="gap-2">
                  {moveTargets.map(folder => (
                    <Button
                      key={folder.id}
                      isDisabled={actionLoading}
                      variant="outline"
                      onPress={() => void handleMoveToFolder(folder.id)}>
                      {folder.icon} {folder.name}
                    </Button>
                  ))}
                </View>
              </ScrollView>
              <Button isDisabled={actionLoading} variant="ghost" onPress={closeDialogs}>
                {t('关闭')}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
