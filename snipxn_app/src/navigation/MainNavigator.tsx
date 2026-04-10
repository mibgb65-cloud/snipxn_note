import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/common/AppIcon';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useDeviceType } from '../hooks';
import { useI18n } from '../i18n';
import { WorkspaceScreen } from '../screens/main/WorkspaceScreen';
import { useUIStore } from '../stores';
import { useAppTheme, withAlpha } from '../theme';

import { CommunityStack } from './CommunityStack';
import { NoteStack } from './NoteStack';
import type { MainDrawerParamList, MainTabParamList } from './types';

const LazySettingsScreen = React.lazy(() =>
  import('../screens/settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })),
);

function SettingsScreenLazy() {
  return (
    <Suspense fallback={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>}>
      <LazySettingsScreen />
    </Suspense>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();
const EXPANDED_SIDEBAR_WIDTH = 320;
const COLLAPSED_SIDEBAR_WIDTH = 92;
const MOBILE_TAB_BAR_BASE_HEIGHT = 58;
const MOBILE_TAB_BAR_MIN_BOTTOM_PADDING = 10;

export function MainNavigator() {
  const { isTablet } = useDeviceType();
  const { palette } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isSidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const tabBarBottomPadding = Math.max(insets.bottom, MOBILE_TAB_BAR_MIN_BOTTOM_PADDING);

  const handleSidebarToggle = () => toggleSidebar();

  const getTabIcon = (
    routeName: keyof MainTabParamList,
    color: string,
    focused: boolean,
  ) => {
    if (routeName === 'NotesTab') {
      return <AppIcon color={color} name="notes" size={20} strokeWidth={focused ? 2.3 : 2} />;
    }

    if (routeName === 'CommunityTab') {
      return (
        <AppIcon color={color} name="community" size={20} strokeWidth={focused ? 2.3 : 2} />
      );
    }

    return <AppIcon color={color} name="settings" size={20} strokeWidth={focused ? 2.3 : 2} />;
  };

  if (isTablet) {
    return (
      <Drawer.Navigator
        drawerContent={() => (
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: 'permanent',
          overlayColor: 'transparent',
          sceneStyle: { backgroundColor: palette.canvas },
          drawerStyle: {
            width: isSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH,
            backgroundColor: palette.panelStrong,
            borderRightColor: palette.borderStrong,
          },
        }}>
        <Drawer.Screen name="Workspace" component={WorkspaceScreen} />
        <Drawer.Screen name="Community" component={CommunityStack} />
        <Drawer.Screen name="Settings" component={SettingsScreenLazy} />
      </Drawer.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: palette.canvas },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSoft,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 3,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: MOBILE_TAB_BAR_BASE_HEIGHT + tabBarBottomPadding,
          borderWidth: 0,
          borderTopWidth: 1,
          borderTopColor: withAlpha(palette.primary, 0.18),
          backgroundColor: palette.panelRaised,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: tabBarBottomPadding,
          shadowColor: palette.shadow,
          shadowOpacity: 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 14,
        },
        tabBarIcon: ({ color, focused }) => (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: focused ? withAlpha(palette.primary, 0.14) : 'transparent',
            }}>
            {getTabIcon(route.name, color, focused)}
          </View>
        ),
      })}>
      <Tab.Screen
        name="NotesTab"
        component={NoteStack}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route);
          const isEditing = focusedRoute === 'NoteEditor';
          return {
            title: t('笔记'),
            ...(isEditing && {
              tabBarStyle: { display: 'none' as const },
            }),
          };
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route);
          const isNested = focusedRoute === 'PostDetail' || focusedRoute === 'UserProfile';
          return {
            title: t('社区'),
            ...(isNested && {
              tabBarStyle: { display: 'none' as const },
            }),
          };
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreenLazy}
        options={{ title: t('我的') }}
      />
    </Tab.Navigator>
  );
}
