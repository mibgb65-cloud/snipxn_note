import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SearchScreen, NoteEditorScreen } from '../screens';

import type { SearchStackParamList } from './types';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
