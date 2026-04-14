import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCanvas } from '../../components/common';
import { TabPageHeader } from '../../components/common/TabPageHeader';
import { NoteList } from '../../components/note';
import { useI18n } from '../../i18n';
import { useNoteStore } from '../../stores';

type SearchStateSnapshot = {
  activeFolderId: string | null;
  activeTagId: string | null;
  activeView: ReturnType<typeof useNoteStore.getState>['activeView'];
};

export function SearchScreen() {
  const { t } = useI18n();
  const setActiveTagId = useNoteStore(state => state.setActiveTagId);
  const setActiveView = useNoteStore(state => state.setActiveView);
  const setActiveFolderView = useNoteStore(state => state.setActiveFolderView);
  const setSearchQuery = useNoteStore(state => state.setSearchQuery);
  const previousStateRef = useRef<SearchStateSnapshot | null>(null);
  const lastSearchQueryRef = useRef('');

  useFocusEffect(
    useCallback(() => {
      const currentState = useNoteStore.getState();
      previousStateRef.current = {
        activeFolderId: currentState.activeFolderId,
        activeTagId: currentState.activeTagId,
        activeView: currentState.activeView,
      };

      setActiveTagId(null);
      setActiveView('all');
      setSearchQuery(lastSearchQueryRef.current);

      return () => {
        lastSearchQueryRef.current = useNoteStore.getState().searchQuery;

        const previousState = previousStateRef.current;

        if (!previousState) {
          return;
        }

        setActiveTagId(previousState.activeTagId);
        if (previousState.activeView === 'folder') {
          setActiveFolderView(previousState.activeFolderId);
        } else {
          setActiveView(previousState.activeView);
        }
        setSearchQuery('');
      };
    }, [setActiveFolderView, setActiveTagId, setActiveView, setSearchQuery]),
  );

  return (
    <AppCanvas className="flex-1">
      <TabPageHeader title={t('搜索')} />
      <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
        <View className="flex-1">
          <NoteList
            forceEditorScreenNavigation
            showCreateButton={false}
            emptyIcon="search"
            emptyTitle={t('搜索笔记')}
            emptyHint={t('输入关键词，按标题、摘要或内容快速找到笔记。')}
          />
        </View>
      </SafeAreaView>
    </AppCanvas>
  );
}
