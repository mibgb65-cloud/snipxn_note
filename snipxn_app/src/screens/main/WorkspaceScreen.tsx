import { Button, Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
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

export function WorkspaceScreen() {
  const { showSidebar } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const safeAreaEdges = showSidebar ? (['top', 'left', 'right'] as const) : undefined;

  const { folders, activeFolderId, fetchFolders } = useFolderStore(useShallow(state => ({
    folders: state.folders,
    activeFolderId: state.activeFolderId,
    fetchFolders: state.fetchFolders,
  })));

  const { notes, activeView, searchQuery, setSearchQuery, activeTagId, selectedNoteId, fetchNotes, fetchTags } = useNoteStore(useShallow(state => ({
    notes: state.notes,
    activeView: state.activeView,
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
    activeTagId: state.activeTagId,
    selectedNoteId: state.selectedNoteId,
    fetchNotes: state.fetchNotes,
    fetchTags: state.fetchTags,
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
    void fetchFolders();
    void fetchTags();
  }, [fetchFolders, fetchTags]);

  useEffect(() => {
    void fetchNotes();
  }, [activeFolderId, activeView, fetchNotes]);

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

  if (!showSidebar) {
    return (
      <AppCanvas className="flex-1">
        <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
          <View className="flex-1">
            {renderWorkspaceHeader()}
            <NoteList />
          </View>
        </SafeAreaView>
      </AppCanvas>
    );
  }

  return (
    <AppCanvas className="flex-1">
      <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
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
                    <NoteList showSearchHeader={false} />
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
