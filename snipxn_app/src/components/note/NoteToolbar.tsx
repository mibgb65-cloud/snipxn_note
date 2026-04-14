import { Button, Chip, Dialog, FieldError, Input, Label, Spinner, TextField } from 'heroui-native';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';

import { API_BASE_URL, noteApi } from '../../api';
import { useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useFolderStore, useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Note, Tag } from '../../types';
import { MotionPressable } from '../common/AppMotion';
import { GlassPanel } from '../common/AppChrome';
import { AppIcon, type AppIconName } from '../common/AppIcon';

type ToolbarDialog = 'language' | 'tags' | 'share' | 'more' | 'move' | null;

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
  const useCompactLayout = preferCompactLayout || !showSidebar;

  const { tags, createTag, toggleStar, updateNote, deleteNote } = useNoteStore(useShallow(state => ({
    tags: state.tags,
    createTag: state.createTag,
    toggleStar: state.toggleStar,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
  })));
  const folders = useFolderStore(state => state.folders);

  const [activeDialog, setActiveDialog] = useState<ToolbarDialog>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
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

  const closeDialogs = () => {
    setActiveDialog(null);
    setActionLoading(false);
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
      setToolbarError(getErrorMessage(error, t('创建标签失败，请稍后重试。')));
    }
  };

  const handleToggleStar = async () => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      await toggleStar(note.id);
      setActionLoading(false);
    } catch (error) {
      setActionLoading(false);
      setToolbarError(getErrorMessage(error, t('更新星标状态失败，请稍后重试。')));
    }
  };

  const handleShareNote = async () => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      await onRequestSave();
      const result = await noteApi.shareNote(note.id);
      const nextShareToken = result.shareToken;
      const resolvedTitle = title.trim().length > 0 ? title.trim() : t('无标题笔记');
      setShareToken(nextShareToken);
      await Share.share({
        title: resolvedTitle,
        message: buildShareUrl(nextShareToken),
      });
      setActionLoading(false);
    } catch (error) {
      setActionLoading(false);
      setToolbarError(getErrorMessage(error, t('分享笔记失败，请稍后重试。')));
    }
  };

  const openShareDialog = async () => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      const result = await noteApi.getShareStatus(note.id);
      setShareToken(result.shareToken ?? null);
      setActiveDialog('share');
      setActionLoading(false);
    } catch (error) {
      setActionLoading(false);
      setToolbarError(getErrorMessage(error, t('获取分享状态失败，请稍后重试。')));
      setActiveDialog('share');
    }
  };

  const handleGenerateShare = async () => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      await onRequestSave();
      const result = await noteApi.shareNote(note.id);
      setShareToken(result.shareToken);
      setActionLoading(false);
    } catch (error) {
      setActionLoading(false);
      setToolbarError(getErrorMessage(error, t('生成分享链接失败，请稍后重试。')));
    }
  };

  const handleCancelShare = async () => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      await noteApi.cancelShare(note.id);
      setShareToken(null);
      setActionLoading(false);
    } catch (error) {
      setActionLoading(false);
      setToolbarError(getErrorMessage(error, t('取消分享失败，请稍后重试。')));
    }
  };

  const handleShareExternally = async () => {
    if (!shareToken) {
      return;
    }

    try {
      await Share.share({
        title: note.title,
        message: buildShareUrl(shareToken),
      });
    } catch (error) {
      setToolbarError(getErrorMessage(error, t('调用系统分享失败，请稍后重试。')));
    }
  };

  const handleExport = async () => {
    setActionLoading(true);
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
      setToolbarError(getErrorMessage(error, t('导出笔记失败，请稍后重试。')));
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
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
      setToolbarError(getErrorMessage(error, t('删除笔记失败，请稍后重试。')));
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    setActionLoading(true);
    setToolbarError(null);

    try {
      await onRequestSave();
      await updateNote(note.id, { folderId });
      closeDialogs();
    } catch (error) {
      setActionLoading(false);
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
              void handleShareNote();
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
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-4">
                <Dialog.Title>{t('标签')}</Dialog.Title>
                <ScrollView className="max-h-56">
                  <View className="flex-row flex-wrap gap-2">
                    {tags.map(tag => {
                      const isSelected = tagIds.includes(tag.id);

                      return (
                        <Pressable
                          key={tag.id}
                          className="rounded-full border px-4 py-2"
                          style={{
                            borderColor: isSelected ? withAlpha(palette.primary, 0.36) : palette.border,
                            backgroundColor: isSelected ? palette.primarySoft : palette.surfaceAlt,
                          }}
                          onPress={() => handleToggleTag(tag.id)}>
                          <Text className={typography.bodySmall} style={{ color: palette.text }}>
                            {tag.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <View
                  className="rounded-[10px] px-4 py-4"
                  style={{ backgroundColor: palette.surfaceAlt }}>
                  <View className="gap-3">
                    <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                      {t('新建标签')}
                    </Text>
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
                    <Button isDisabled={actionLoading} variant="outline" onPress={() => void handleCreateTag()}>
                      {actionLoading ? (
                        <>
                          <Spinner color="default" size="sm" />
                          <Button.Label>{t('创建中...')}</Button.Label>
                        </>
                      ) : (
                        t('创建并选中')
                      )}
                    </Button>
                  </View>
                </View>

                <Button variant="ghost" onPress={closeDialogs}>
                  {t('完成')}
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'share'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-6" style={{ backgroundColor: palette.surface }}>
            <View className="gap-4">
              <Dialog.Title>{t('分享笔记')}</Dialog.Title>
              {shareToken ? (
                  <View
                    className="rounded-2xl px-4 py-4"
                    style={{ backgroundColor: palette.surfaceAlt }}>
                    <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                      {t('分享链接')}
                    </Text>
                    <Text
                      className={`${typography.bodySmall} mt-2`}
                      selectable
                      style={{ color: palette.text }}>
                      {buildShareUrl(shareToken)}
                    </Text>
                  </View>
                ) : (
                  <Text className={typography.body} style={{ color: palette.textSoft }}>
                    {t('还没有生成分享链接。')}
                  </Text>
                )}
              <View className="gap-2">
                {shareToken ? (
                  <>
                    <Button isDisabled={actionLoading} variant="outline" onPress={() => void handleShareExternally()}>
                      {t('调用系统分享')}
                    </Button>
                    <Button isDisabled={actionLoading} variant="danger" onPress={() => void handleCancelShare()}>
                      {t('取消分享')}
                    </Button>
                  </>
                ) : (
                  <Button isDisabled={actionLoading} variant="primary" onPress={() => void handleGenerateShare()}>
                    {actionLoading ? (
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
              <Button isDisabled={actionLoading} variant="ghost" onPress={closeDialogs}>
                {t('关闭')}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={activeDialog === 'more'} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-6" style={{ backgroundColor: palette.surface }}>
            <View className="gap-4">
              <Dialog.Title>{t('更多操作')}</Dialog.Title>
              <Button
                isDisabled={actionLoading}
                variant="outline"
                onPress={() => {
                  void openShareDialog();
                }}>
                {t('管理分享')}
              </Button>
              <Button isDisabled={actionLoading} variant="outline" onPress={() => void handleExport()}>
                {t('导出')}
              </Button>
              <Button
                isDisabled={actionLoading || moveTargets.length === 0 || readOnly}
                variant="outline"
                onPress={() => {
                  setToolbarError(null);
                  setActiveDialog('move');
                }}>
                {t('移动到文件夹')}
              </Button>
              <Button isDisabled={actionLoading} variant="danger" onPress={() => void handleDelete()}>
                {t('删除')}
              </Button>
              <Button isDisabled={actionLoading} variant="ghost" onPress={closeDialogs}>
                {t('取消')}
              </Button>
            </View>
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





