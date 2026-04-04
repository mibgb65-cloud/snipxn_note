import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useI18n } from '../i18n';
import { NoteEditorScreen, WorkspaceScreen } from '../screens';

import type { NoteStackParamList } from './types';

const Stack = createNativeStackNavigator<NoteStackParamList>();

export function NoteStack() {
  const { t } = useI18n();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Workspace"
        component={WorkspaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ title: t('笔记编辑器') }}
      />
    </Stack.Navigator>
  );
}
