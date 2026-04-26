import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  APP_LAYOUT_TRANSITION,
  APP_PANEL_ENTERING,
  APP_PANEL_EXITING,
  AppCanvas,
  AppIcon,
} from '../../components/common';
import { TabPageHeader } from '../../components/common/TabPageHeader';
import { NoteEditorPane } from '../../components/note/NoteEditorPane';
import { NoteList } from '../../components/note/NoteList';
import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useFolderStore, useNoteStore, useUIStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

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

function TabletWorkspaceHome({
  activeView,
  folderCount,
  noteCount,
  starredCount,
}: {
  activeView: NoteView;
  folderCount: number;
  noteCount: number;
  starredCount: number;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const viewLabel =
    activeView === 'all'
      ? t('全部笔记')
      : activeView === 'starred'
        ? t('收藏笔记')
        : activeView === 'trash'
          ? t('回收站')
          : t('文件夹视图');

  return (
    <View
      className="flex-1 justify-center"
      style={{ backgroundColor: palette.canvas }}>
      <View className="w-full max-w-[720px] self-center px-8">
        <View className="mb-8 h-12 w-12 items-center justify-center rounded-[12px]" style={{ backgroundColor: withAlpha(palette.primary, 0.12) }}>
          <AppIcon color={palette.primary} name="notes" size={22} />
        </View>
        <Text className={typography.h1} style={{ color: palette.text }}>
          {t('工作区')}
        </Text>
        <Text className={`${typography.body} mt-3 max-w-[560px]`} style={{ color: palette.textSoft }}>
          {t('当前笔记空间概览。编辑区保持空闲，直到进入某条笔记。')}
        </Text>

        <View className="mt-8 flex-row items-center">
          {[
            { label: t('当前视图'), value: viewLabel },
            { label: t('笔记'), value: String(noteCount) },
            { label: t('收藏'), value: String(starredCount) },
            { label: t('文件夹'), value: String(folderCount) },
          ].map((item, index) => (
            <View
              key={item.label}
              className="min-w-0 flex-1"
              style={{
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: withAlpha(palette.textSoft, 0.16),
                paddingLeft: index === 0 ? 0 : 18,
                paddingRight: 18,
              }}>
              <Text className={typography.caption} numberOfLines={1} style={{ color: palette.textSoft }}>
                {item.label}
              </Text>
              <Text className={`${typography.h3} mt-1`} numberOfLines={1} style={{ color: palette.text }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-10 h-px" style={{ backgroundColor: withAlpha(palette.textSoft, 0.14) }} />
        <View className="mt-5 flex-row items-center gap-3">
          <AppIcon color={palette.textSoft} name="sync" size={17} />
          <Text className={typography.bodySmall} style={{ color: palette.textMuted }}>
            {t('本地内容会随同步状态更新。')}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function WorkspaceScreen() {
  const { showSidebar } = useDeviceType();
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
    setSearchQuery,
    activeTagId,
    selectedNoteId,
    fetchNotes,
    fetchTags,
    clearSelection,
    setActiveView,
    setActiveFolderView,
    setActiveTagId,
  } = useNoteStore(useShallow(state => ({
    notes: state.notes,
    activeView: state.activeView,
    activeFolderId: state.activeFolderId,
    setSearchQuery: state.setSearchQuery,
    activeTagId: state.activeTagId,
    selectedNoteId: state.selectedNoteId,
    fetchNotes: state.fetchNotes,
    fetchTags: state.fetchTags,
    clearSelection: state.clearSelection,
    setActiveView: state.setActiveView,
    setActiveFolderView: state.setActiveFolderView,
    setActiveTagId: state.setActiveTagId,
  })));

  const setSidebarCollapsed = useUIStore(state => state.setSidebarCollapsed);
  const setSidebarHidden = useUIStore(state => state.setSidebarHidden);

  const [isEditorFullScreen, setIsEditorFullScreen] = useState(false);
  const usesInlineEditor = showSidebar;

  // Run mode: save previous state and restore on exit
  const prevSidebarCollapsedRef = useRef(false);
  const prevFullScreenRef = useRef(false);
  const hasResetTabletSelectionRef = useRef(false);

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
    if (!showSidebar || hasResetTabletSelectionRef.current) {
      return;
    }

    clearSelection();
    hasResetTabletSelectionRef.current = true;
  }, [clearSelection, showSidebar]);

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

  useEffect(() => {
    if (!showSidebar || !visibleSelectedNoteId) {
      setIsEditorFullScreen(false);
    }
  }, [showSidebar, visibleSelectedNoteId]);

  const isFocused = useIsFocused();

  useEffect(() => {
    setSidebarHidden(isFocused && showSidebar && Boolean(visibleSelectedNoteId) && isEditorFullScreen);
  }, [isEditorFullScreen, isFocused, setSidebarHidden, showSidebar, visibleSelectedNoteId]);

  useEffect(() => {
    return () => {
      setSidebarHidden(false);
    };
  }, [setSidebarHidden]);

  useFocusEffect(
    useCallback(() => {
      if (showSidebar || useNoteStore.getState().searchQuery.trim().length === 0) {
        return;
      }

      setSearchQuery('');
    }, [setSearchQuery, showSidebar]),
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

  if (!showSidebar || !usesInlineEditor) {
    return (
      <AppCanvas className="flex-1">
        <TabPageHeader title={t('笔记')} />
        <SafeAreaView edges={mobileSafeAreaEdges} style={{ flex: 1 }}>
          <View className="flex-1">
            <NoteList
              forceEditorScreenNavigation={showSidebar}
              showCreateButton={showSidebar}
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
    <AppCanvas className="flex-1" decorative={false}>
      <SafeAreaView edges={desktopSafeAreaEdges} style={{ flex: 1 }}>
        <Animated.View
          key={visibleSelectedNoteId ?? 'empty-editor'}
          entering={APP_PANEL_ENTERING}
          exiting={APP_PANEL_EXITING}
          layout={APP_LAYOUT_TRANSITION}
          style={[
            styles.tabletEditorPane,
            {
              paddingHorizontal: isEditorFullScreen ? 8 : 12,
              paddingBottom: 12,
              paddingTop: isEditorFullScreen ? 8 : 12,
            },
          ]}>
          {visibleSelectedNoteId ? (
            <NoteEditorPane
              key={visibleSelectedNoteId}
              isFullScreen={isEditorFullScreen}
              noteId={visibleSelectedNoteId}
              surfaceMode="plain"
              onEnterRunMode={handleEnterRunMode}
              onExitRunMode={handleExitRunMode}
              onToggleFullScreen={() => {
                setIsEditorFullScreen(current => !current);
              }}
            />
          ) : (
            <TabletWorkspaceHome
              activeView={activeView}
              folderCount={folders.filter(folder => !folder.isDeleted).length}
              noteCount={notes.length}
              starredCount={notes.filter(note => note.isStarred).length}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </AppCanvas>
  );
}

const styles = StyleSheet.create({
  tabletEditorPane: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});
