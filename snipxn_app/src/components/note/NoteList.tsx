import { useNavigation } from '@react-navigation/native';
import { Button, Spinner } from 'heroui-native';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { applyFilters, useFolderStore, useNoteStore, useSyncStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Note } from '../../types';
import { IconBadge } from '../common/AppChrome';
import { AppIcon } from '../common/AppIcon';

import { NoteListItem } from './NoteListItem';

const MOBILE_TAB_BAR_BASE_HEIGHT = 58;
const MOBILE_TAB_BAR_MIN_BOTTOM_PADDING = 10;
const LIST_BOTTOM_PADDING = 24;

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

function resolveCreateFolderId(
  activeFolderId: string | null,
  folders: ReturnType<typeof useFolderStore.getState>['folders'],
): string | null {
  if (activeFolderId && folders.some(folder => folder.id === activeFolderId)) {
    return activeFolderId;
  }

  return folders.find(folder => folder.isDefault)?.id ?? folders[0]?.id ?? null;
}

export function NoteList({ showSearchHeader = true }: { showSearchHeader?: boolean }) {
  const navigation = useNavigation<any>();
  const { showSidebar } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const tabBarHeight = showSidebar
    ? 0
    : MOBILE_TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, MOBILE_TAB_BAR_MIN_BOTTOM_PADDING);
  const fabBottom = 24 + tabBarHeight;
  const listBottomPaddingWithCreate = 84 + tabBarHeight;

  const { folders, activeFolderId, fetchFolders } = useFolderStore(useShallow(state => ({
    folders: state.folders,
    activeFolderId: state.activeFolderId,
    fetchFolders: state.fetchFolders,
  })));

  const { allNotes, loading, activeView, searchQuery, activeTagId } = useNoteStore(useShallow(state => ({
    allNotes: state.notes,
    loading: state.loading,
    activeView: state.activeView,
    searchQuery: state.searchQuery,
    activeTagId: state.activeTagId,
  })));

  const notes = useMemo(
    () => applyFilters(allNotes, searchQuery, activeTagId),
    [allNotes, searchQuery, activeTagId],
  );
  const { selectedNoteId, setSearchQuery, fetchNotes, fetchTags, createNote, selectNote } = useNoteStore(useShallow(state => ({
    selectedNoteId: state.selectedNoteId,
    setSearchQuery: state.setSearchQuery,
    fetchNotes: state.fetchNotes,
    fetchTags: state.fetchTags,
    createNote: state.createNote,
    selectNote: state.selectNote,
  })));

  const syncNow = useSyncStore(state => state.syncNow);

  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showCreateButton = activeView !== 'trash';

  const handleSelectNote = async (noteId: string) => {
    await selectNote(noteId);

    if (!showSidebar) {
      navigation.navigate('NoteEditor', { noteId });
    }
  };

  const handleCreateNote = async () => {
    if (!showCreateButton) {
      return;
    }

    const folderId = resolveCreateFolderId(activeFolderId, folders);

    if (!folderId) {
      setErrorMessage(t('请先创建至少一个文件夹，再新建笔记。'));
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const note = await createNote(folderId);

      if (showSidebar) {
        await selectNote(note.id);
      } else {
        navigation.navigate('NoteEditor', { noteId: note.id });
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('新建笔记失败，请稍后重试。')));
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMessage(null);

    try {
      const result = await syncNow();

      await Promise.all([fetchFolders(), fetchTags(), fetchNotes()]);

      if (result.status === 'offline') {
        setErrorMessage(t('当前处于离线状态，已显示本地笔记。'));
      } else if (result.status !== 'success' && result.status !== 'already_syncing') {
        setErrorMessage(result.message ?? t('同步未完成，已刷新本地列表。'));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('刷新笔记失败，请稍后重试。')));
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => {
    if (!showSearchHeader && !errorMessage) {
      return null;
    }

    return (
      <View className={showSearchHeader ? 'px-4 pb-2 pt-1' : 'px-4 pb-3 pt-3'}>
        {showSearchHeader ? (
          <View
            className="flex-row items-center gap-2.5 rounded-full border px-3.5 py-2"
            style={{
              borderColor: withAlpha(palette.primary, 0.12),
              backgroundColor: palette.panelInset,
            }}>
            <AppIcon color={palette.primary} name="search" size={16} />
            <TextInput
              autoCapitalize="none"
              className={`${typography.bodySmall} flex-1`}
              onChangeText={value => {
                setErrorMessage(null);
                setSearchQuery(value);
              }}
              placeholder={t('搜索标题、摘要或内容')}
              placeholderTextColor={palette.placeholder}
              returnKeyType="search"
              style={{ color: palette.text, paddingVertical: 0, lineHeight: 18 }}
              value={searchQuery}
            />
          </View>
        ) : null}

        {errorMessage ? (
          <View className={showSearchHeader ? 'mt-2 px-1' : ''}>
            <Text className={typography.bodySmall} style={{ color: palette.danger }}>
              {errorMessage}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <IconBadge icon="notes" iconSize={34} size={96} />
      <Text className={`${typography.h3} mt-5`} style={{ color: palette.text }}>
        {t('暂无笔记')}
      </Text>
      <Text
        className={`${typography.body} mt-2 text-center`}
        style={{ color: palette.textSoft }}>
        {searchQuery.trim().length > 0
          ? t('没有找到匹配当前搜索条件的内容。')
          : t('从右下角开始，写下你的第一条笔记。')}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (loading && notes.length > 0) {
      return (
        <View className="items-center py-3">
          <Spinner color={palette.accent} size="sm" />
        </View>
      );
    }

    return <View className={showCreateButton ? 'h-3' : 'h-2'} />;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <FlatList<Note>
        contentContainerStyle={{
          flexGrow: notes.length === 0 ? 1 : 0,
          paddingBottom: showCreateButton
            ? listBottomPaddingWithCreate
            : LIST_BOTTOM_PADDING,
        }}
        data={notes}
        initialNumToRender={15}
        keyExtractor={item => item.id}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        maxToRenderPerBatch={10}
        onRefresh={() => {
          void handleRefresh();
        }}
        refreshing={refreshing}
        removeClippedSubviews
        renderItem={({ item }) => (
          <View className="px-4">
            <NoteListItem
              isSelected={selectedNoteId === item.id}
              note={item}
              onPress={() => {
                void handleSelectNote(item.id);
              }}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={50}
        windowSize={5}
      />

      {showCreateButton ? (
        <View
          className="absolute right-6 rounded-full"
          style={{
            bottom: fabBottom,
            shadowColor: palette.shadow,
            shadowOpacity: 0.28,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 12 },
            elevation: 16,
          }}>
          <Button
            className="h-16 w-16 rounded-full"
            isDisabled={creating}
            onPress={() => {
              void handleCreateNote();
            }}
            variant="primary"
            style={{ backgroundColor: palette.cta }}>
            {creating ? <Spinner color="default" size="sm" /> : <AppIcon color="#FFFFFF" name="plus" size={22} />}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
