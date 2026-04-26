import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

const transparentContent = {
  backgroundColor: 'transparent',
};

export const ROOT_STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: transparentContent,
};

export const SUBPAGE_STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...ROOT_STACK_SCREEN_OPTIONS,
  animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
  animationTypeForReplace: 'push',
  gestureDirection: 'horizontal',
  gestureEnabled: true,
};

export const EDITOR_STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...SUBPAGE_STACK_SCREEN_OPTIONS,
  animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
};

export const AUTH_STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...ROOT_STACK_SCREEN_OPTIONS,
  animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
  animationTypeForReplace: 'push',
  gestureEnabled: true,
};
