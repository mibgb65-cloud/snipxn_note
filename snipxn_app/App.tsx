import './src/global.css';

import { HeroUINativeProvider } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LaunchExperience } from './src/components/common';
import { initDatabase } from './src/db/database';
import { isOnline, startNetworkMonitor, stopNetworkMonitor } from './src/db/sync/networkMonitor';
import { useI18nStore } from './src/i18n';
import { RootNavigator } from './src/navigation';
import { useShallow } from 'zustand/react/shallow';

import { configureGoogleSignIn } from './src/services/googleSignIn';
import { useAppUpdateStore, useAuthStore, useSyncStore } from './src/stores';
import { ThemeProvider, useAppTheme } from './src/theme';

const APP_READY_MAX_WAIT_MS = 4000;

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function AppContent() {
  const { palette } = useAppTheme();
  const hydrateLanguage = useI18nStore(state => state.hydrateLanguage);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const { syncNow, setOffline } = useSyncStore(useShallow(state => ({
    syncNow: state.syncNow,
    setOffline: state.setOffline,
  })));
  const checkForUpdates = useAppUpdateStore(state => state.checkForUpdates);
  const [appReady, setAppReady] = useState(false);
  const [launchFinished, setLaunchFinished] = useState(false);

  const handleLaunchFinish = useCallback(() => {
    setLaunchFinished(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const runBackgroundStartupTasks = async () => {
      try {
        const online = await isOnline();

        if (!online) {
          setOffline();
          return;
        }

        await checkForUpdates();

        if (useAuthStore.getState().isAuthenticated) {
          await syncNow();
        }
      } catch (error) {
        console.warn('Background startup tasks failed.', error);
      }
    };

    startNetworkMonitor(() => {
      void checkForUpdates();

      if (useAuthStore.getState().isAuthenticated) {
        void syncNow();
      }
    });

    const bootstrapApp = async () => {
      configureGoogleSignIn();

      const startupTask = (async () => {
        await hydrateLanguage();
        await initDatabase();
        await restoreSession();
      })().catch(error => {
        console.error('Failed to restore the local app session.', error);
      });

      try {
        await Promise.race([startupTask, delay(APP_READY_MAX_WAIT_MS)]);
      } finally {
        if (mounted) {
          setAppReady(true);
        }
      }

      await startupTask;
      await runBackgroundStartupTasks();
    };

    void bootstrapApp();

    return () => {
      mounted = false;
      stopNetworkMonitor();
    };
  }, [checkForUpdates, hydrateLanguage, restoreSession, setOffline, syncNow]);

  return (
    <HeroUINativeProvider>
      <View style={[styles.rootSurface, { backgroundColor: palette.canvas }]}>
        {appReady ? <RootNavigator /> : null}
        {!launchFinished ? (
          <View style={StyleSheet.absoluteFill}>
            <LaunchExperience ready={appReady} onFinish={handleLaunchFinish} />
          </View>
        ) : null}
      </View>
    </HeroUINativeProvider>
  );
}

const styles = StyleSheet.create({
  rootSurface: {
    flex: 1,
  },
});

export default App;
