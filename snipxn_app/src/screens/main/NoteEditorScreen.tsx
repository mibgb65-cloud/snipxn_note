import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { NoteEditorPane, type NoteEditorPaneHandle } from '../../components/note/NoteEditorPane';
import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import type { NoteStackParamList } from '../../navigation/types';
import { useNoteStore, useUIStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

type Props = NativeStackScreenProps<NoteStackParamList, 'NoteEditor'>;

export function NoteEditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const { showSidebar } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  const currentNote = useNoteStore(state => state.currentNote);
  const setSidebarCollapsed = useUIStore(state => state.setSidebarCollapsed);

  const editorRef = useRef<NoteEditorPaneHandle | null>(null);
  const previousSidebarCollapsedRef = useRef(false);

  const note = currentNote?.id === noteId ? currentNote : null;

  const handleBack = useCallback(async () => {
    if (editorRef.current?.closeFloatingPanel()) {
      return;
    }

    await editorRef.current?.flushSave();

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleManualSave = async () => {
    await editorRef.current?.flushSave();
  };

  useEffect(() => {
    if (!showSidebar) {
      return;
    }

    previousSidebarCollapsedRef.current = useUIStore.getState().sidebarCollapsed;
    setSidebarCollapsed(true);

    return () => {
      setSidebarCollapsed(previousSidebarCollapsedRef.current);
    };
  }, [setSidebarCollapsed, showSidebar]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) {
        return false;
      }

      void handleBack();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [handleBack, navigation, noteId]);

  return (
    <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-1 px-3 pb-4 pt-3" style={{ backgroundColor: palette.canvas }}>
          <View
            className="mb-3 rounded-[10px] border px-3 py-2.5"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.surface,
            }}>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => void handleBack()}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: withAlpha(palette.primary, 0.1) }}>
                <AppIcon color={palette.primary} name="arrow-left" size={20} />
              </Pressable>
              <Text
                className={`${typography.h3} min-w-0 flex-1`}
                numberOfLines={1}
                style={{ color: palette.text }}>
                {note?.title ?? t('笔记编辑器')}
              </Text>
              <Pressable
                onPress={() => void handleManualSave()}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: withAlpha(palette.primary, 0.1) }}>
                <AppIcon color={palette.primary} name="save" size={20} />
              </Pressable>
            </View>
          </View>

          <NoteEditorPane preferCompactLayout ref={editorRef} noteId={noteId} />
        </View>
      </SafeAreaView>
    </View>
  );
}
