import { useNavigation } from '@react-navigation/native';
import { Button, Dialog, FieldError, Input, Label, Spinner, TextField } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import * as noteDao from '../../db/dao/noteDao';
import { useShallow } from 'zustand/react/shallow';

import { useFolderStore, useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Folder } from '../../types';
import { GlassPanel } from '../common/AppChrome';
import { AppIcon, type AppIconName } from '../common/AppIcon';

type FolderDialogMode = 'create' | 'rename' | 'icon' | null;
const SIDEBAR_LIST_ICON_SIZE = 17;
const SIDEBAR_EMOJI_SIZE = 15;
const FOLDER_ICON_OPTIONS: Array<{ value: string; label: string; icon: AppIconName }> = [
  { value: 'folder', label: '通用', icon: 'folder' },
  { value: 'notes', label: '笔记', icon: 'notes' },
  { value: 'code', label: '代码', icon: 'code' },
  { value: 'sparkles', label: '灵感', icon: 'sparkles' },
  { value: 'bookmark', label: '收藏', icon: 'bookmark' },
  { value: 'database', label: '资料', icon: 'database' },
  { value: 'tag', label: '标签', icon: 'tag' },
  { value: 'star', label: '重要', icon: 'star' },
];
const FOLDER_ICON_NAME_SET = new Set(FOLDER_ICON_OPTIONS.map(option => option.value));

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

function formatFolderIcon(icon: string): string {
  return icon === 'folder' ? '📁' : icon;
}

function isFolderEmojiIcon(icon: string): boolean {
  const trimmedIcon = icon.trim();

  return (
    trimmedIcon.length > 0 &&
    trimmedIcon.length <= 4 &&
    !/[A-Za-z0-9]/.test(trimmedIcon) &&
    !/\s/.test(trimmedIcon)
  );
}

function renderFolderGlyph(
  icon: string,
  color: string,
  iconSize = SIDEBAR_LIST_ICON_SIZE,
  emojiSize = SIDEBAR_EMOJI_SIZE,
) {
  if (FOLDER_ICON_NAME_SET.has(icon)) {
    return <AppIcon color={color} name={icon as AppIconName} size={iconSize} strokeWidth={2} />;
  }

  if (!isFolderEmojiIcon(icon)) {
    return <AppIcon color={color} name="folder" size={iconSize} strokeWidth={2} />;
  }

  return (
    <Text
      style={{
        color,
        fontSize: emojiSize,
        fontWeight: '600',
        lineHeight: emojiSize + 1,
      }}>
      {formatFolderIcon(icon)}
    </Text>
  );
}

function buildMovedFolderIds(folderId: string, folders: Folder[], direction: -1 | 1): string[] {
  const nextFolders = [...folders];
  const currentIndex = nextFolders.findIndex(folder => folder.id === folderId);
  const targetIndex = currentIndex + direction;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextFolders.length) {
    return folders.map(folder => folder.id);
  }

  const [folder] = nextFolders.splice(currentIndex, 1);
  nextFolders.splice(targetIndex, 0, folder);

  return nextFolders.map(item => item.id);
}

export function FolderList() {
  const navigation = useNavigation<any>();
  const { isTablet, palette, typography } = useAppTheme();

  const {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    setActiveFolder,
  } = useFolderStore(useShallow(state => ({
    folders: state.folders,
    createFolder: state.createFolder,
    updateFolder: state.updateFolder,
    deleteFolder: state.deleteFolder,
    reorderFolders: state.reorderFolders,
    setActiveFolder: state.setActiveFolder,
  })));

  const {
    activeView,
    activeFolderId,
    notes,
    fetchNotes,
    setActiveView,
    setActiveFolderView,
    setActiveTagId,
  } = useNoteStore(useShallow(state => ({
    activeView: state.activeView,
    activeFolderId: state.activeFolderId,
    notes: state.notes,
    fetchNotes: state.fetchNotes,
    setActiveView: state.setActiveView,
    setActiveFolderView: state.setActiveFolderView,
    setActiveTagId: state.setActiveTagId,
  })));

  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [dialogMode, setDialogMode] = useState<FolderDialogMode>(null);
  const [menuFolder, setMenuFolder] = useState<Folder | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('folder');
  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nameError = useMemo(() => {
    if ((dialogMode === 'create' || dialogMode === 'rename') && nameInput.trim().length === 0) {
      return '请输入文件夹名称';
    }

    return null;
  }, [dialogMode, nameInput]);

  const selectedFolderIcon = iconInput.trim() || 'folder';
  const selectedFolderIconOption =
    FOLDER_ICON_OPTIONS.find(option => option.value === selectedFolderIcon) ?? FOLDER_ICON_OPTIONS[0];
  const folderPreviewName =
    nameInput.trim() ||
    editingFolder?.name ||
    (dialogMode === 'create' ? '新建文件夹' : '未命名文件夹');
  const folderDialogTitle =
    dialogMode === 'create' ? '新建文件夹' : dialogMode === 'rename' ? '重命名文件夹' : '修改文件夹图标';
  const folderDialogDescription =
    dialogMode === 'create'
      ? '创建一个新的分组入口，方便整理笔记。'
      : dialogMode === 'rename'
        ? '修改文件夹名称，不会影响内部笔记内容。'
        : '为当前文件夹选择一个更清晰的识别图标。';

  useEffect(() => {
    let isMounted = true;

    const loadNoteCounts = async () => {
      const entries = await Promise.all(
        folders.map(async folder => [folder.id, await noteDao.getNoteCount(folder.id)] as const),
      );

      if (isMounted) {
        setNoteCounts(Object.fromEntries(entries));
      }
    };

    void loadNoteCounts();

    return () => {
      isMounted = false;
    };
  }, [folders, notes]);

  const closeDialogs = () => {
    setDialogMode(null);
    setMenuFolder(null);
    setEditingFolder(null);
    setNameTouched(false);
    setSubmitting(false);
    setErrorMessage(null);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setMenuFolder(null);
    setEditingFolder(null);
    setNameInput('');
    setIconInput('folder');
    setNameTouched(false);
    setErrorMessage(null);
  };

  const openRenameDialog = (folder: Folder) => {
    setMenuFolder(null);
    setEditingFolder(folder);
    setDialogMode('rename');
    setNameInput(folder.name);
    setIconInput(folder.icon);
    setNameTouched(false);
    setErrorMessage(null);
  };

  const openIconDialog = (folder: Folder) => {
    setMenuFolder(null);
    setEditingFolder(folder);
    setDialogMode('icon');
    setNameInput(folder.name);
    setIconInput(folder.icon);
    setNameTouched(false);
    setErrorMessage(null);
  };

  const handleSelectFolder = async (folderId: string) => {
    setActiveTagId(null);
    setActiveFolder(folderId);
    setActiveFolderView(folderId);
    navigation.navigate('Workspace', { screen: 'Workspace' });
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (folder.isDefault) {
      return;
    }

    setSubmitting(true);

    try {
      await deleteFolder(folder.id);
      closeDialogs();

      if (activeView === 'folder' && activeFolderId === folder.id) {
        const fallbackFolderId = useFolderStore.getState().activeFolderId;

        if (fallbackFolderId) {
          setActiveFolderView(fallbackFolderId);
        } else {
          setActiveView('all');
        }
        return;
      }

      await fetchNotes();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, '删除文件夹失败，请稍后重试。'));
    }
  };

  const handleMoveFolder = async (folder: Folder, direction: -1 | 1) => {
    const nextFolderIds = buildMovedFolderIds(folder.id, folders, direction);

    setSubmitting(true);

    try {
      await reorderFolders(nextFolderIds);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, '更新文件夹顺序失败，请稍后重试。'));
    }
  };

  const handleSubmit = async () => {
    setNameTouched(true);
    setErrorMessage(null);

    if (nameError) {
      return;
    }

    setSubmitting(true);

    try {
      if (dialogMode === 'create') {
        setActiveTagId(null);
        const folder = await createFolder(nameInput.trim(), selectedFolderIcon);
        setActiveFolderView(folder.id);
      } else if (dialogMode === 'rename' && editingFolder) {
        await updateFolder(editingFolder.id, { name: nameInput.trim() });
      } else if (dialogMode === 'icon' && editingFolder) {
        await updateFolder(editingFolder.id, { icon: selectedFolderIcon });
      }

      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, '保存文件夹失败，请稍后重试。'));
    }
  };

  return (
    <View className="gap-1">
      <View className="gap-1">
        {folders.map(folder => {
          const isActive = activeView === 'folder' && activeFolderId === folder.id;

          return (
            <Pressable
              key={folder.id}
              className="rounded-[8px] px-0 py-0"
              onLongPress={() => {
                setMenuFolder(folder);
                setErrorMessage(null);
              }}
              onPress={() => {
                void handleSelectFolder(folder.id);
              }}
              style={{
                borderColor: isActive ? withAlpha(palette.primary, 0.22) : 'transparent',
                borderWidth: 1,
                backgroundColor: isActive ? withAlpha(palette.primary, 0.08) : 'transparent',
              }}>
              <View className="flex-row items-center justify-between gap-3 px-3 py-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <View
                    className="h-7 w-1 rounded-full"
                    style={{ backgroundColor: isActive ? palette.primary : 'transparent' }}
                  />
                  <View
                    className="h-8 w-8 items-center justify-center">
                    {renderFolderGlyph(folder.icon, isActive ? palette.primary : palette.textMuted)}
                  </View>
                  <Text
                    className={`${typography.body} flex-1`}
                    numberOfLines={1}
                    style={{ color: isActive ? palette.text : palette.textMuted }}>
                    {folder.name}
                  </Text>
                </View>
                <Text className={typography.caption} style={{ color: palette.textSoft }}>
                  {noteCounts[folder.id] ?? 0}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        className="rounded-[8px] px-0 py-0"
        onPress={openCreateDialog}
        style={{ borderColor: 'transparent', borderWidth: 1 }}>
        <View className="flex-row items-center gap-3 px-3 py-3">
          <View className="h-8 w-8 items-center justify-center">
            <AppIcon color={palette.primary} name="plus" size={SIDEBAR_LIST_ICON_SIZE} />
          </View>
          <Text className={typography.body} style={{ color: palette.primary }}>
            新建文件夹
          </Text>
        </View>
      </Pressable>

      <Dialog isOpen={menuFolder !== null} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: palette.surface }}>
            <GlassPanel
              className="px-6 py-6"
              highlight={palette.primary}
              style={{ backgroundColor: palette.surface }}>
              <View className="gap-5">
                <View
                  className="rounded-[10px] border px-4 py-4"
                  style={{ borderColor: palette.border, backgroundColor: palette.panelInset }}>
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-[10px] border"
                      style={{
                        borderColor: withAlpha(palette.primary, 0.18),
                        backgroundColor: withAlpha(palette.primary, 0.12),
                      }}>
                      {renderFolderGlyph(menuFolder?.icon ?? 'folder', palette.primary, 20, 18)}
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className={typography.caption} style={{ color: palette.primary }}>
                        Folder Actions
                      </Text>
                      <Dialog.Title>{menuFolder?.name ?? '文件夹操作'}</Dialog.Title>
                      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                        调整名称、图标或排序位置。
                      </Text>
                    </View>
                  </View>
                </View>

                {errorMessage ? (
                  <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                    {errorMessage}
                  </Text>
                ) : null}

                <View className="gap-2.5">
                  <Button
                    isDisabled={submitting}
                    variant="outline"
                    onPress={() => menuFolder && openRenameDialog(menuFolder)}>
                    重命名
                  </Button>
                  <Button
                    isDisabled={submitting}
                    variant="outline"
                    onPress={() => menuFolder && openIconDialog(menuFolder)}>
                    修改图标
                  </Button>
                  <Button
                    isDisabled={submitting || !menuFolder}
                    variant="outline"
                    onPress={() => menuFolder && void handleMoveFolder(menuFolder, -1)}>
                    上移
                  </Button>
                  <Button
                    isDisabled={submitting || !menuFolder}
                    variant="outline"
                    onPress={() => menuFolder && void handleMoveFolder(menuFolder, 1)}>
                    下移
                  </Button>
                  <Button
                    isDisabled={submitting || menuFolder?.isDefault}
                    variant="danger"
                    onPress={() => menuFolder && void handleDeleteFolder(menuFolder)}>
                    删除
                  </Button>
                </View>

                {menuFolder?.isDefault ? (
                  <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                    默认文件夹不可删除。
                  </Text>
                ) : null}

                <Button isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                  取消
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={dialogMode !== null} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            className="mx-5 overflow-hidden rounded-[16px] p-0"
            style={{
              backgroundColor: palette.surface,
              maxWidth: isTablet ? 580 : undefined,
            }}>
            <View
              className="border-b px-5 py-5"
              style={{ borderBottomColor: withAlpha(palette.textSoft, 0.14) }}>
              <View className="flex-row items-center gap-3">
                <View
                  className="h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: palette.primarySoft }}>
                  <AppIcon color={palette.primary} name="folder" size={20} />
                </View>
                <View className="min-w-0 flex-1">
                  <Dialog.Title>{folderDialogTitle}</Dialog.Title>
                  <Text className={`${typography.bodySmall} mt-1`} style={{ color: palette.textSoft }}>
                    {folderDialogDescription}
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-5 px-5 py-5">
              <View className="gap-4" style={{ flexDirection: isTablet ? 'row' : 'column' }}>
                <View
                  className="rounded-[14px] border px-4 py-4"
                  style={{
                    borderColor: withAlpha(palette.primary, 0.18),
                    backgroundColor: palette.panelInset,
                    width: isTablet ? 180 : undefined,
                  }}>
                  <View
                    className="h-14 w-14 items-center justify-center rounded-[14px]"
                    style={{ backgroundColor: withAlpha(palette.primary, 0.12) }}>
                    {renderFolderGlyph(selectedFolderIconOption.value, palette.primary, 22, 20)}
                  </View>
                  <Text
                    className={`${typography.body} mt-4`}
                    numberOfLines={2}
                    style={{ color: palette.text, fontWeight: '700' }}>
                    {folderPreviewName}
                  </Text>
                  <Text className={`${typography.caption} mt-1`} style={{ color: palette.textSoft }}>
                    {dialogMode === 'rename' ? '名称更新预览' : '将在左侧文件夹列表中显示'}
                  </Text>
                </View>

                <View className="min-w-0 flex-1 gap-4">
                  {errorMessage ? (
                    <View
                      className="rounded-[12px] border px-3 py-3"
                      style={{
                        borderColor: withAlpha(palette.danger, 0.24),
                        backgroundColor: withAlpha(palette.danger, 0.08),
                      }}>
                      <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}

                  {dialogMode === 'create' || dialogMode === 'rename' ? (
                    <TextField isRequired isInvalid={nameTouched && nameError !== null}>
                      <Label>文件夹名称</Label>
                      <Input
                        placeholder="例如：算法练习、项目资料"
                        value={nameInput}
                        onBlur={() => setNameTouched(true)}
                        onChangeText={value => {
                          setNameInput(value);
                          setErrorMessage(null);
                        }}
                      />
                      <FieldError>{nameError ?? ''}</FieldError>
                    </TextField>
                  ) : null}

                  {dialogMode === 'create' || dialogMode === 'icon' ? (
                    <View className="gap-3">
                      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                        图标样式
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {FOLDER_ICON_OPTIONS.map(iconOption => {
                          const isSelected = selectedFolderIcon === iconOption.value;

                          return (
                            <Pressable
                              key={iconOption.value}
                              accessibilityRole="button"
                              accessibilityLabel={`选择${iconOption.label}图标`}
                              className="items-center rounded-[12px] border px-2 py-3"
                              onPress={() => {
                                setIconInput(iconOption.value);
                                setErrorMessage(null);
                              }}
                              style={{
                                borderColor: isSelected
                                  ? withAlpha(palette.primary, 0.34)
                                  : palette.border,
                                backgroundColor: isSelected
                                  ? withAlpha(palette.primary, 0.12)
                                  : palette.surfaceAlt,
                                width: 68,
                              }}>
                              <AppIcon
                                color={isSelected ? palette.primary : palette.textMuted}
                                name={iconOption.icon}
                                size={18}
                              />
                              <Text
                                className={`${typography.caption} mt-2`}
                                numberOfLines={1}
                                style={{ color: isSelected ? palette.primary : palette.textSoft }}>
                                {iconOption.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              <View
                className="flex-row gap-3 border-t pt-4"
                style={{ borderTopColor: withAlpha(palette.textSoft, 0.12) }}>
                <Button className="flex-1" isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                  取消
                </Button>
                <Button
                  className="flex-1"
                  isDisabled={
                    submitting ||
                    ((dialogMode === 'create' || dialogMode === 'rename') &&
                      nameInput.trim().length === 0)
                  }
                  variant="primary"
                  onPress={() => void handleSubmit()}>
                  {submitting ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>保存中...</Button.Label>
                    </>
                  ) : dialogMode === 'create' ? (
                    '创建文件夹'
                  ) : (
                    '保存'
                  )}
                </Button>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
