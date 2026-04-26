import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SearchScreen, NoteEditorScreen } from '../screens';

import {
  EDITOR_STACK_SCREEN_OPTIONS,
  ROOT_STACK_SCREEN_OPTIONS,
} from './stackTransitions';
import type { SearchStackParamList } from './types';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator screenOptions={ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={EDITOR_STACK_SCREEN_OPTIONS}
      />
    </Stack.Navigator>
  );
}
