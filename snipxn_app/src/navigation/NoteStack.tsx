import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NoteEditorScreen, WorkspaceScreen } from '../screens';

import {
  EDITOR_STACK_SCREEN_OPTIONS,
  ROOT_STACK_SCREEN_OPTIONS,
} from './stackTransitions';
import type { NoteStackParamList } from './types';

const Stack = createNativeStackNavigator<NoteStackParamList>();

export function NoteStack() {
  return (
    <Stack.Navigator screenOptions={ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="Workspace" component={WorkspaceScreen} />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={EDITOR_STACK_SCREEN_OPTIONS}
      />
    </Stack.Navigator>
  );
}
