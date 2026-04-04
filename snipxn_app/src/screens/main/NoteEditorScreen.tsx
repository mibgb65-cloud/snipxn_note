import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { NoteEditorPane, type NoteEditorPaneHandle } from '../../components/note/NoteEditorPane';
import { useI18n } from '../../i18n';
import type { NoteStackParamList } from '../../navigation/types';
import { useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

type Props = NativeStackScreenProps<NoteStackParamList, 'NoteEditor'>;

export function NoteEditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  const currentNote = useNoteStore(state => state.currentNote);

  const editorRef = useRef<NoteEditorPaneHandle | null>(null);

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
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-4 pb-5 pt-4" style={{ backgroundColor: palette.canvas }}>
          <View
            className="mb-4 rounded-[10px] border px-4 py-4"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.surface,
            }}>
            <View className="flex-row items-center justify-between gap-3">
              <Button variant="outline" onPress={() => void handleBack()}>
                {t('返回')}
              </Button>
              <View className="min-w-0 flex-1 items-center px-1">
                <View
                  className="mb-2 h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: withAlpha(palette.primary, 0.14) }}>
                  <AppIcon color={palette.primary} name="notes" size={20} />
                </View>
                <Text className={`${typography.h3} text-center`} numberOfLines={1} style={{ color: palette.text }}>
                  {note?.title ?? t('笔记编辑器')}
                </Text>
                <Text
                  className={`${typography.bodySmall} text-center`}
                  numberOfLines={1}
                  style={{ color: palette.textSoft }}>
                  {note ? `noteId: ${note.id}` : t('正在加载笔记内容...')}
                </Text>
              </View>
              <Button variant="outline" onPress={() => void handleManualSave()}>
                {t('保存')}
              </Button>
            </View>
          </View>

          <NoteEditorPane ref={editorRef} noteId={noteId} />
        </View>
      </SafeAreaView>
    </View>
  );
}
