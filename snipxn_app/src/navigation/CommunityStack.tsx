import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useI18n } from '../i18n';
import { FeedScreen } from '../screens';

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
  const { t } = useI18n();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreenLazy}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreenLazy}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
