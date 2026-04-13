import { useFocusEffect } from '@react-navigation/native';
import { Button, Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AdaptiveLayout,
  APP_HEADER_ENTERING,
  APP_HEADER_EXITING,
  APP_LAYOUT_TRANSITION,
  AppCanvas,
  AppIcon,
  GlassPanel,
} from '../../components/common';
import { TabPageHeader } from '../../components/common/TabPageHeader';
import { NoteEditorPane } from '../../components/note/NoteEditorPane';
import { NoteList } from '../../components/note/NoteList';
import { useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useFolderStore, useNoteStore, useSyncStore, useUIStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import { describeImportNotesResult, pickAndImportNotes } from '../../utils';

function getViewLabel(
  activeView: ReturnType<typeof useNoteStore.getState>['activeView'],
  t: (text: string) => string,
): string {
  if (activeView === 'all') {
    return t('全部笔记');
  }

  if (activeView === 'starred') {
    return t('收藏笔记');
  }

  if (activeView === 'trash') {
    return t('回收站');
  }

  return t('文件夹');
}

function resolvePreferredFolderId(
  preferredFolderId: string | null,
  fallbackFolderId: string | null,
  folders: { id: string; isDefault: boolean; isDeleted: boolean }[],
): string | null {
  if (preferredFolderId && folders.some(folder => folder.id === preferredFolderId && !folder.isDeleted)) {
    return preferredFolderId;
  }

  if (fallbackFolderId && folders.some(folder => folder.id === fallbackFolderId && !folder.isDeleted)) {
    return fallbackFolderId;
  }

  return folders.find(folder => folder.isDefault && !folder.isDeleted)?.id ?? folders.find(folder => !folder.isDeleted)?.id ?? null;
}

type WorkspaceFeedback = {
  status: 'success' | 'warning' | 'danger' | 'accent';
  title: string;
  description: string;
} | null;

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

function WorkspaceCloudStatus() {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const status = useSyncStore(state => state.status);
  const message = useSyncStore(state => state.message);

  const indicatorConfig =
    status === 'syncing'
      ? {
          color: palette.accent,
          icon: 'sync' as const,
          label: t('云同步中'),
        }
      : status === 'success'
        ? {
            color: palette.success,
            icon: 'check-circle' as const,
            label: t('已同步到云端'),
          }
        : status === 'offline'
          ? {
              color: palette.textSoft,
              icon: 'cloud-off' as const,
              label: t('当前离线'),
              helper: message ?? t('修改已保存在本地。'),
            }
          : status === 'error'
            ? {
                color: palette.danger,
                icon: 'alert-circle' as const,
                label: t('同步失败'),
                helper: message ?? t('请稍后重试。'),
              }
            : {
                color: palette.textMuted,
                icon: 'sync' as const,
                label: t('云同步待命'),
              };

  return (
    <View
      className="shrink-0 h-10 flex-row items-center gap-1.5 rounded-full border px-3"
      style={{
        borderColor: withAlpha(indicatorConfig.color, 0.16),
        backgroundColor: withAlpha(indicatorConfig.color, 0.12),
      }}>
      {status === 'syncing' ? (
        <Spinner color={indicatorConfig.color} size="sm" />
      ) : (
        <AppIcon color={indicatorConfig.color} name={indicatorConfig.icon} size={14} />
      )}
      <Text className={typography.caption} style={{ color: indicatorConfig.color }}>
        {indicatorConfig.label}
      </Text>
    </View>
  );
}

function WorkspaceSharedTopBar({
  searchQuery,
  onSearchQueryChange,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  return (
    <View className="px-4 pb-3 pt-2">
      <GlassPanel className="px-4 py-4" variant="strong">
        <View className="flex-row items-center gap-3">
          <View
            className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-[8px] border px-3.5 py-3"
            style={{
              borderColor: withAlpha(palette.primary, 0.12),
              backgroundColor: palette.panelInset,
            }}>
            <AppIcon color={palette.primary} name="search" size={16} />
            <TextInput
              autoCapitalize="none"
              className={`${typography.bodySmall} flex-1`}
              onChangeText={onSearchQueryChange}
              placeholder={t('搜索标题、摘要、标签或内容')}
              placeholderTextColor={palette.placeholder}
              returnKeyType="search"
              style={{ color: palette.text, paddingVertical: 0, lineHeight: 18 }}
              value={searchQuery}
            />
          </View>

          <WorkspaceCloudStatus />
        </View>
      </GlassPanel>
    </View>
  );
}

type NoteView = 'folder' | 'all' | 'starred' | 'trash';

interface MobileFilterBarProps {
  activeView: NoteView;
  folders: { id: string; name: string; isDefault: boolean; isDeleted: boolean }[];
  currentFolderId: string | null;
  rememberedFolderId: string | null;
  onSelectView: (view: NoteView) => void;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
}

function MobileFilterBar({
  activeView,
  folders,
  currentFolderId,
  rememberedFolderId,
  onSelectView,
  onSelectFolder,
  onCreateFolder,
}: MobileFilterBarProps) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const visibleFolders = folders.filter(f => !f.isDeleted);
  const selectedFolderId = activeView === 'folder' ? currentFolderId : rememberedFolderId;
  const selectedFolderName =
    visibleFolders.find(folder => folder.id === selectedFolderId)?.name ?? null;

  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? withAlpha(palette.primary, 0.18) : withAlpha(palette.textSoft, 0.08),
    borderColor: active ? palette.primary : 'transparent',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  });

  const chipTextColor = (active: boolean) => (active ? palette.primary : palette.text);

  const handleCreate = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await onCreateFolder(trimmed);
      setNewFolderName('');
      setCreateDialogOpen(false);
      setFolderDialogOpen(false);
    } catch {
      Alert.alert(t('创建失败'), t('无法创建文件夹，请稍后重试。'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <View className="px-4 pb-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center">
            <Pressable onPress={() => onSelectView('all')} style={chipStyle(activeView === 'all')}>
              <Text style={{ color: chipTextColor(activeView === 'all'), fontSize: 13, fontWeight: '600' }}>
                {t('全部')}
              </Text>
            </Pressable>
            <Pressable onPress={() => onSelectView('starred')} style={chipStyle(activeView === 'starred')}>
              <Text style={{ color: chipTextColor(activeView === 'starred'), fontSize: 13, fontWeight: '600' }}>
                {t('收藏')}
              </Text>
            </Pressable>
            <Pressable onPress={() => onSelectView('trash')} style={chipStyle(activeView === 'trash')}>
              <Text style={{ color: chipTextColor(activeView === 'trash'), fontSize: 13, fontWeight: '600' }}>
                {t('回收站')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setFolderDialogOpen(true)} style={chipStyle(activeView === 'folder')}>
              <Text style={{ color: chipTextColor(activeView === 'folder'), fontSize: 13, fontWeight: '600' }}>
                {selectedFolderName ? `📁 ${selectedFolderName}` : `📁 ${t('文件夹')}`}
                {' ›'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Folder switcher */}
      <Modal visible={folderDialogOpen} transparent animationType="slide" onRequestClose={() => setFolderDialogOpen(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'transparent' }} onPress={() => setFolderDialogOpen(false)}>
          <Pressable
            className="rounded-t-[28px] px-5 pb-6 pt-4"
            style={{
              backgroundColor: palette.canvas,
              borderTopWidth: 1,
              borderTopColor: withAlpha(palette.primary, 0.12),
              maxHeight: '78%',
            }}
            onPress={e => e.stopPropagation()}>
            <View
              className="self-center rounded-full"
              style={{
                width: 42,
                height: 4,
                backgroundColor: withAlpha(palette.textSoft, 0.24),
                marginBottom: 14,
              }}
            />
            <Text className={typography.h3} style={{ color: palette.text, marginBottom: 8 }}>
              {t('选择文件夹')}
            </Text>
            <Text className={typography.bodySmall} style={{ color: palette.textSoft, marginBottom: 16 }}>
              {t('切到全部笔记，或者进入一个具体文件夹。')}
            </Text>
            <Pressable
              className="mb-2 flex-row items-center rounded-xl px-4 py-3"
              style={{
                backgroundColor: activeView === 'all'
                  ? withAlpha(palette.primary, 0.12)
                  : 'transparent',
              }}
              onPress={() => {
                onSelectView('all');
                setFolderDialogOpen(false);
              }}>
              <AppIcon color={palette.primary} name="notes" size={18} />
              <Text className="ml-3 flex-1" style={{ color: palette.text, fontSize: 15 }}>
                {t('全部笔记')}
              </Text>
              {activeView === 'all' ? (
                <AppIcon color={palette.primary} name="check-circle" size={18} />
              ) : null}
            </Pressable>
            {visibleFolders.map(folder => (
              <Pressable
                key={folder.id}
                className="flex-row items-center rounded-xl px-4 py-3 mb-1.5"
                style={{
                  backgroundColor: currentFolderId === folder.id && activeView === 'folder'
                    ? withAlpha(palette.primary, 0.12)
                    : 'transparent',
                }}
                onPress={() => {
                  onSelectFolder(folder.id);
                  setFolderDialogOpen(false);
                }}>
                <AppIcon color={palette.primary} name="folder" size={18} />
                <Text
                  className="ml-3 flex-1"
                  numberOfLines={1}
                  style={{ color: palette.text, fontSize: 15 }}>
                  {folder.name}
                  {folder.isDefault ? ` (${t('默认')})` : ''}
                </Text>
                {currentFolderId === folder.id && activeView === 'folder' ? (
                  <AppIcon color={palette.primary} name="check-circle" size={18} />
                ) : null}
              </Pressable>
            ))}
            {visibleFolders.length === 0 ? (
              <Text className={typography.body} style={{ color: palette.textSoft, textAlign: 'center', paddingVertical: 12 }}>
                {t('暂无文件夹')}
              </Text>
            ) : null}
            <Pressable
              className="mt-3 flex-row items-center justify-center rounded-xl py-3"
              style={{ backgroundColor: withAlpha(palette.primary, 0.1) }}
              onPress={() => setCreateDialogOpen(true)}>
              <AppIcon color={palette.primary} name="plus" size={16} />
              <Text className="ml-2" style={{ color: palette.primary, fontWeight: '600', fontSize: 14 }}>
                {t('新建文件夹')}
              </Text>
            </Pressable>
            <Pressable
              className="mt-2 items-center py-2"
              onPress={() => setFolderDialogOpen(false)}>
              <Text style={{ color: palette.textSoft, fontSize: 14 }}>{t('取消')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create folder dialog */}
      <Modal visible={createDialogOpen} transparent animationType="fade" onRequestClose={() => setCreateDialogOpen(false)}>
        <Pressable className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setCreateDialogOpen(false)}>
          <Pressable
            className="w-[85%] max-w-[360px] rounded-2xl p-5"
            style={{ backgroundColor: palette.surface }}
            onPress={e => e.stopPropagation()}>
            <Text className={typography.h3} style={{ color: palette.text, marginBottom: 16 }}>
              {t('新建文件夹')}
            </Text>
            <TextInput
              autoFocus
              className="rounded-xl border px-4 py-3 mb-4"
              style={{
                borderColor: withAlpha(palette.primary, 0.2),
                backgroundColor: palette.panelInset,
                color: palette.text,
                fontSize: 15,
              }}
              placeholder={t('文件夹名称')}
              placeholderTextColor={palette.placeholder}
              value={newFolderName}
              onChangeText={setNewFolderName}
              onSubmitEditing={() => void handleCreate()}
              returnKeyType="done"
            />
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl py-3"
                style={{ backgroundColor: withAlpha(palette.textSoft, 0.1) }}
                onPress={() => {
                  setCreateDialogOpen(false);
                  setNewFolderName('');
                }}>
                <Text style={{ color: palette.textSoft, fontWeight: '600' }}>{t('取消')}</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl py-3"
                style={{ backgroundColor: palette.primary, opacity: creating || !newFolderName.trim() ? 0.5 : 1 }}
                disabled={creating || !newFolderName.trim()}
                onPress={() => void handleCreate()}>
                {creating ? (
                  <Spinner color="#fff" size="sm" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{t('创建')}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function WorkspaceScreen() {
  const { showSidebar } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const desktopSafeAreaEdges = ['top', 'left', 'right'] as const;
  const mobileSafeAreaEdges = ['left', 'right'] as const;

  const {
    folders,
    activeFolderId: rememberedFolderId,
    fetchFolders,
    createFolder,
    setActiveFolder,
  } = useFolderStore(useShallow(state => ({
    folders: state.folders,
    activeFolderId: state.activeFolderId,
    fetchFolders: state.fetchFolders,
    createFolder: state.createFolder,
    setActiveFolder: state.setActiveFolder,
  })));

  const {
    notes,
    activeView,
    activeFolderId,
    searchQuery,
    setSearchQuery,
    activeTagId,
    selectedNoteId,
    fetchNotes,
    fetchTags,
    setActiveView,
    setActiveFolderView,
    setActiveTagId,
  } = useNoteStore(useShallow(state => ({
    notes: state.notes,
    activeView: state.activeView,
    activeFolderId: state.activeFolderId,
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
    activeTagId: state.activeTagId,
    selectedNoteId: state.selectedNoteId,
    fetchNotes: state.fetchNotes,
    fetchTags: state.fetchTags,
    setActiveView: state.setActiveView,
    setActiveFolderView: state.setActiveFolderView,
    setActiveTagId: state.setActiveTagId,
  })));

  const syncNow = useSyncStore(state => state.syncNow);

  const setSidebarCollapsed = useUIStore(state => state.setSidebarCollapsed);

  const [importing, setImporting] = useState(false);
  const [isEditorFullScreen, setIsEditorFullScreen] = useState(false);
  const [, setWorkspaceFeedback] = useState<WorkspaceFeedback>(null);

  // Run mode: save previous state and restore on exit
  const prevSidebarCollapsedRef = useRef(false);
  const prevFullScreenRef = useRef(false);

  const handleEnterRunMode = useCallback(() => {
    prevSidebarCollapsedRef.current = useUIStore.getState().sidebarCollapsed;
    prevFullScreenRef.current = isEditorFullScreen;
    setSidebarCollapsed(true);
    setIsEditorFullScreen(true);
  }, [isEditorFullScreen, setSidebarCollapsed]);

  const handleExitRunMode = useCallback(() => {
    setSidebarCollapsed(prevSidebarCollapsedRef.current);
    setIsEditorFullScreen(prevFullScreenRef.current);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await Promise.all([fetchFolders(), fetchTags()]);
      } finally {
        if (!cancelled) {
          await fetchNotes();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchFolders, fetchNotes, fetchTags]);

  useEffect(() => {
    if (activeView !== 'folder') {
      return;
    }

    const resolvedFolderId = resolvePreferredFolderId(activeFolderId, rememberedFolderId, folders);

    if (!resolvedFolderId || activeFolderId === resolvedFolderId) {
      return;
    }

    setActiveFolderView(resolvedFolderId);
  }, [activeFolderId, activeView, folders, rememberedFolderId, setActiveFolderView]);

  const visibleSelectedNoteId = useMemo(() => {
    if (!selectedNoteId) return null;
    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) return null;
    if (activeTagId && !note.tagIds.includes(activeTagId)) return null;
    return selectedNoteId;
  }, [selectedNoteId, notes, activeTagId]);
  const showImportButton = activeView !== 'trash';

  useEffect(() => {
    if (!showSidebar || !visibleSelectedNoteId) {
      setIsEditorFullScreen(false);
    }
  }, [showSidebar, visibleSelectedNoteId]);

  useFocusEffect(
    useCallback(() => {
      if (showSidebar || useNoteStore.getState().searchQuery.trim().length === 0) {
        return;
      }

      setSearchQuery('');
    }, [setSearchQuery, showSidebar]),
  );

  const currentLocationLabel = useMemo(() => {
    if (activeView === 'folder' && activeFolderId) {
      return folders.find(folder => folder.id === activeFolderId)?.name ?? t('未命名文件夹');
    }

    return getViewLabel(activeView, t);
  }, [activeFolderId, activeView, folders, t]);

  const handleImportNotes = async () => {
    if (!showImportButton) {
      return;
    }

    setImporting(true);
    setWorkspaceFeedback(null);

    try {
      const importResult = await pickAndImportNotes();

      if (!importResult) {
        return;
      }

      const syncResult = await syncNow();
      await Promise.all([fetchFolders(), fetchTags(), fetchNotes()]);

      if (syncResult.status === 'success' || syncResult.status === 'already_syncing') {
        setWorkspaceFeedback({
          status: 'success',
          title: t('导入完成'),
          description: describeImportNotesResult(importResult),
        });
        return;
      }

      setWorkspaceFeedback({
        status: 'accent',
        title: t('导入已提交'),
        description:
          syncResult.status === 'offline'
            ? t('文件已经上传，但当前处于离线状态，请稍后联网后同步本地列表。')
            : syncResult.message ?? describeImportNotesResult(importResult),
      });
    } catch (error) {
      setWorkspaceFeedback({
        status: 'danger',
        title: t('导入失败'),
        description: getErrorMessage(error, t('导入笔记失败，请稍后重试。')),
      });
    } finally {
      setImporting(false);
    }
  };

  const renderWorkspaceHeader = () => (
    <Animated.View layout={APP_LAYOUT_TRANSITION}>
      <Animated.View entering={APP_HEADER_ENTERING} exiting={APP_HEADER_EXITING}>
        <View className="px-4 pb-3 pt-1">
          <GlassPanel className="px-4 py-3" highlight={palette.primary}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className={typography.h3} style={{ color: palette.text }}>
                  {t('工作区')}
                </Text>
                <Text className={typography.caption} style={{ color: palette.textSoft }}>
                  {currentLocationLabel}
                </Text>
              </View>

              {showImportButton ? (
                <Button isDisabled={importing} size="sm" variant="outline" onPress={() => void handleImportNotes()}>
                  {importing ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>{t('导入中...')}</Button.Label>
                    </>
                  ) : (
                    t('导入笔记')
                  )}
                </Button>
              ) : null}
            </View>
          </GlassPanel>
        </View>
      </Animated.View>
    </Animated.View>
  );

  const handleSelectView = useCallback((view: NoteView) => {
    setActiveTagId(null);
    setActiveView(view);
  }, [setActiveTagId, setActiveView]);

  const handleSelectFolder = useCallback((folderId: string) => {
    setActiveTagId(null);
    setActiveFolder(folderId);
    setActiveFolderView(folderId);
  }, [setActiveFolder, setActiveFolderView, setActiveTagId]);

  const handleCreateFolder = useCallback(async (name: string) => {
    setActiveTagId(null);
    const folder = await createFolder(name);
    setActiveFolderView(folder.id);
  }, [createFolder, setActiveFolderView, setActiveTagId]);

  if (!showSidebar) {
    return (
      <AppCanvas className="flex-1">
        <TabPageHeader title={t('笔记')} />
        <SafeAreaView edges={mobileSafeAreaEdges} style={{ flex: 1 }}>
          <View className="flex-1">
            <NoteList
              showCreateButton={false}
              showSearchHeader={true}
              headerComponent={
                <MobileFilterBar
                  activeView={activeView}
                  folders={folders}
                  currentFolderId={activeFolderId}
                  rememberedFolderId={rememberedFolderId}
                  onSelectView={handleSelectView}
                  onSelectFolder={handleSelectFolder}
                  onCreateFolder={handleCreateFolder}
                />
              }
            />
          </View>
        </SafeAreaView>
      </AppCanvas>
    );
  }

  return (
    <AppCanvas className="flex-1">
      <SafeAreaView edges={desktopSafeAreaEdges} style={{ flex: 1 }}>
        <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ flex: 1, minHeight: 0 }}>
          {isEditorFullScreen ? null : (
            <Animated.View layout={APP_LAYOUT_TRANSITION}>
              <Animated.View entering={APP_HEADER_ENTERING} exiting={APP_HEADER_EXITING}>
                <WorkspaceSharedTopBar
                  onSearchQueryChange={value => {
                    setWorkspaceFeedback(null);
                    setSearchQuery(value);
                  }}
                  searchQuery={searchQuery}
                />
              </Animated.View>
            </Animated.View>
          )}
          <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ flex: 1, minHeight: 0 }}>
            <AdaptiveLayout
              listWidth={isEditorFullScreen ? 0 : 360}
              renderContent={() => (
                <NoteEditorPane
                  key={visibleSelectedNoteId ?? 'empty'}
                  emptyMessage={t('选择一个笔记开始编辑')}
                  isFullScreen={isEditorFullScreen}
                  noteId={visibleSelectedNoteId}
                  onEnterRunMode={handleEnterRunMode}
                  onExitRunMode={handleExitRunMode}
                  onToggleFullScreen={
                    visibleSelectedNoteId
                      ? () => {
                          setIsEditorFullScreen(current => !current);
                        }
                      : undefined
                  }
                />
              )}
              renderList={() =>
                isEditorFullScreen ? null : (
                  <View className="flex-1">
                    {renderWorkspaceHeader()}
                    <NoteList showCreateButton={showSidebar} showSearchHeader={false} />
                  </View>
                )
              }
              renderSidebar={() => null}
              sidebarWidth={0}
            />
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </AppCanvas>
  );
}
