import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { CreatePostScreen, FeedScreen } from '../screens';

import {
  CREATE_POST_STACK_SCREEN_OPTIONS,
  ROOT_STACK_SCREEN_OPTIONS,
  SUBPAGE_STACK_SCREEN_OPTIONS,
} from './stackTransitions';
import type { CommunityStackParamList } from './types';

const LazyPostDetailScreen = React.lazy(() =>
  import('../screens/community/PostDetailScreen').then(m => ({ default: m.PostDetailScreen })),
);
const LazyUserProfileScreen = React.lazy(() =>
  import('../screens/community/UserProfileScreen').then(m => ({ default: m.UserProfileScreen })),
);

function ScreenFallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

function PostDetailScreenLazy(props: any) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <LazyPostDetailScreen {...props} />
    </Suspense>
  );
}

function UserProfileScreenLazy(props: any) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <LazyUserProfileScreen {...props} />
    </Suspense>
  );
}

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={CREATE_POST_STACK_SCREEN_OPTIONS}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreenLazy}
        options={SUBPAGE_STACK_SCREEN_OPTIONS}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreenLazy}
        options={SUBPAGE_STACK_SCREEN_OPTIONS}
      />
    </Stack.Navigator>
  );
}
