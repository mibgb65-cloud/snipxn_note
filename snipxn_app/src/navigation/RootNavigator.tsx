import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import * as userApi from '../api/user';
import { OnboardingHomeTransition } from '../components/common';
import { parseOAuthCallbackUrl, type OAuthCallbackParams } from '../config/oauth';
import { SetupProfileScreen } from '../screens';
import { useAuthStore } from '../stores';
import { useAppTheme } from '../theme';

import { AuthStack } from './AuthStack';
import { MainNavigator } from './MainNavigator';

const SetupStack = createNativeStackNavigator<{ SetupProfile: undefined }>();

function SetupProfileNavigator() {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: false }}>
      <SetupStack.Screen name="SetupProfile" component={SetupProfileScreen} />
    </SetupStack.Navigator>
  );
}

export function RootNavigator() {
  const { navigationTheme, palette } = useAppTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isNewUser = useAuthStore(state => state.isNewUser);
  const user = useAuthStore(state => state.user);

  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [homeTransitionVisible, setHomeTransitionVisible] = useState(false);
  const [homeTransitionKey, setHomeTransitionKey] = useState(0);
  const processingRef = useRef(false);
  const previousAuthStateRef = useRef({ isAuthenticated, isNewUser });

  const handleOAuthCallback = useCallback(async (params: OAuthCallbackParams) => {
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;
    setOauthProcessing(true);

    try {
      if (params.action === 'login') {
        await useAuthStore.getState().loginWithOAuth(params.provider, params.code);
      } else {
        const redirectUri = 'snipxn://oauth/callback';
        await userApi.bindGithub(params.code, redirectUri);

        const { useUserStore } = await import('../stores/userStore');
        await useUserStore.getState().fetchLinkedAccounts();

        Alert.alert('GitHub', '绑定成功');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '操作失败，请稍后重试。';
      Alert.alert(
        params.action === 'login' ? '登录失败' : '绑定失败',
        message,
      );
    } finally {
      processingRef.current = false;
      setOauthProcessing(false);
    }
  }, []);

  useEffect(() => {
    function handleUrl(event: { url: string }) {
      const params = parseOAuthCallbackUrl(event.url);
      if (params) {
        handleOAuthCallback(params).catch(error => {
          console.warn('Failed to handle OAuth callback URL.', error);
        });
      }
    }

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL()
      .then(url => {
        if (url) {
          const params = parseOAuthCallbackUrl(url);
          if (params) {
            return handleOAuthCallback(params);
          }
        }

        return undefined;
      })
      .catch(error => {
        console.warn('Failed to read the initial OAuth callback URL.', error);
      });

    return () => {
      subscription.remove();
    };
  }, [handleOAuthCallback]);

  useEffect(() => {
    const previous = previousAuthStateRef.current;
    const completedOnboarding =
      previous.isAuthenticated &&
      previous.isNewUser &&
      isAuthenticated &&
      !isNewUser;

    if (completedOnboarding) {
      setHomeTransitionKey(value => value + 1);
      setHomeTransitionVisible(true);
    }

    previousAuthStateRef.current = { isAuthenticated, isNewUser };
  }, [isAuthenticated, isNewUser]);

  return (
    <NavigationContainer
      theme={navigationTheme}
      onReady={() => {
        BootSplash.hide({ fade: true }).catch(error => {
          console.warn('Failed to hide the native splash screen.', error);
        });
      }}>
      {!isAuthenticated ? (
        <AuthStack />
      ) : isNewUser ? (
        <SetupProfileNavigator />
      ) : (
        <MainNavigator />
      )}
      {homeTransitionVisible ? (
        <OnboardingHomeTransition
          key={homeTransitionKey}
          displayName={user?.nickname}
          onFinish={() => setHomeTransitionVisible(false)}
        />
      ) : null}
      {oauthProcessing ? (
        <View style={[styles.overlay, { backgroundColor: palette.canvas }]}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
});
