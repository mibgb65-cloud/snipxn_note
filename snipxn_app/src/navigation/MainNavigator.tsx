import { Button, Spinner } from 'heroui-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel, SectionEyebrow } from '../components/common';
import { AppIcon, type AppIconName } from '../components/common/AppIcon';
import { TabPageHeader } from '../components/common/TabPageHeader';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useDeviceType } from '../hooks';
import { translateLiteral, useI18n } from '../i18n';
import { useFolderStore, useNoteStore, useSyncStore, useUIStore } from '../stores';
import { useAppTheme, withAlpha } from '../theme';
import { describeImportNotesResult, pickAndImportNotes } from '../utils';

import {
  createMobileTabBarStyle,
  MOBILE_TAB_BAR_BASE_HEIGHT,
  MOBILE_TAB_BAR_MIN_BOTTOM_PADDING,
} from './mobileTabBarStyle';
import { CommunityStack } from './CommunityStack';
import { NoteStack } from './NoteStack';
import { SearchStack } from './SearchStack';
import type { MainDrawerParamList, MainTabParamList } from './types';

const LazySettingsScreen = React.lazy(() =>
  import('../screens/settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })),
);
const SETTINGS_FALLBACK_ROWS = Array.from({ length: 6 }, (_, index) => index);

function SettingsFallbackBlock({
  className,
  color,
  style,
}: {
  className?: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={className}
      style={[styles.settingsFallbackBlock, { backgroundColor: color }, style]}
    />
  );
}

function SettingsScreenFallback() {
  const { isTablet } = useDeviceType();
  const { palette } = useAppTheme();
  const { t } = useI18n();
  const [reducedMotion, setReducedMotion] = useState(false);
  const blockColor = withAlpha(palette.primary, 0.12);
  const mutedBlockColor = withAlpha(palette.textSoft, 0.14);
  const enteringFor = (index: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.duration(240)
          .delay(50 + index * 45)
          .easing(Easing.out(Easing.cubic));

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setReducedMotion(enabled);
        }
      })
      .catch(() => {
        // Keep the default lightweight entrance if the platform query fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
      {!isTablet ? <TabPageHeader title={t('我的')} /> : null}
      <View
        className={isTablet ? 'flex-1 flex-row px-6 py-6' : 'flex-1 px-5 py-5'}
        style={isTablet ? styles.settingsTabletFallback : undefined}>
        {isTablet ? (
          <Animated.View
            className="mr-5 w-[280px] rounded-[12px] border px-4 py-4"
            entering={enteringFor(0)}
            style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
            <SettingsFallbackBlock className="h-12 w-12 rounded-2xl" color={blockColor} />
            <SettingsFallbackBlock className="mt-5 h-5 w-24 rounded-full" color={mutedBlockColor} />
            <SettingsFallbackBlock className="mt-3 h-3 w-48 rounded-full" color={mutedBlockColor} />
            <View className="mt-6 gap-3">
              {SETTINGS_FALLBACK_ROWS.map(index => (
                <SettingsFallbackBlock
                  key={`settings-fallback-sidebar-${index}`}
                  className="h-10 rounded-2xl"
                  color={mutedBlockColor}
                />
              ))}
            </View>
          </Animated.View>
        ) : null}

        <View className="min-w-0 flex-1">
          <Animated.View
            className="rounded-[12px] border px-4 py-4"
            entering={enteringFor(0)}
            style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
            <View className="flex-row items-center gap-4">
              <SettingsFallbackBlock className="h-14 w-14 rounded-full" color={blockColor} />
              <View className="min-w-0 flex-1 gap-3">
                <SettingsFallbackBlock className="h-4 w-40 rounded-full" color={mutedBlockColor} />
                <SettingsFallbackBlock className="h-3 w-56 rounded-full" color={mutedBlockColor} />
              </View>
            </View>
          </Animated.View>
          <Animated.View
            className="mt-5 overflow-hidden rounded-[12px] border"
            entering={enteringFor(1)}
            style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
            {SETTINGS_FALLBACK_ROWS.map(index => (
              <View
                key={`settings-fallback-row-${index}`}
                className="flex-row items-center px-4 py-4"
                style={[
                  index > 0 ? styles.settingsFallbackRowDivider : undefined,
                  { borderTopColor: palette.border },
                ]}>
                <SettingsFallbackBlock
                  className="h-9 w-9 rounded-xl"
                  color={index % 2 === 0 ? blockColor : mutedBlockColor}
                />
                <View className="ml-3 min-w-0 flex-1 gap-2">
                  <SettingsFallbackBlock
                    className="h-3.5 rounded-full"
                    color={mutedBlockColor}
                    style={index % 2 === 0 ? styles.settingsFallbackLineShort : styles.settingsFallbackLineMedium}
                  />
                  <SettingsFallbackBlock
                    className="h-2.5 rounded-full"
                    color={mutedBlockColor}
                    style={index % 3 === 0 ? styles.settingsFallbackLineLong : styles.settingsFallbackLineDefault}
                  />
                </View>
                <SettingsFallbackBlock className="h-4 w-4 rounded-full" color={mutedBlockColor} />
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function SettingsScreenLazy() {
  return (
    <Suspense fallback={<SettingsScreenFallback />}>
      <LazySettingsScreen />
    </Suspense>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();
const EXPANDED_SIDEBAR_WIDTH = 320;
const COLLAPSED_SIDEBAR_WIDTH = 92;

function resolveCreateFolderId(
  preferredFolderId: string | null,
  fallbackFolderId: string | null,
  folders: ReturnType<typeof useFolderStore.getState>['folders'],
): string | null {
  if (preferredFolderId && folders.some(folder => folder.id === preferredFolderId)) {
    return preferredFolderId;
  }

  if (fallbackFolderId && folders.some(folder => folder.id === fallbackFolderId)) {
    return fallbackFolderId;
  }

  return folders.find(folder => folder.isDefault)?.id ?? folders[0]?.id ?? null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return translateLiteral(error.message);
  }

  return fallback;
}

function NewActionItem({
  description,
  icon,
  index = 0,
  label,
  loading = false,
  menuProgress,
  onPress,
}: {
  description: string;
  icon: AppIconName;
  index?: number;
  label: string;
  loading?: boolean;
  menuProgress?: SharedValue<number>;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const itemAnimatedStyle = useAnimatedStyle(() => {
    if (!menuProgress) {
      return {};
    }

    const start = 0.18 + index * 0.08;
    const end = Math.min(1, start + 0.52);
    const progress = interpolate(menuProgress.value, [0, start, end, 1], [0, 0, 1, 1]);

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [14, 0]) },
        { scale: interpolate(progress, [0, 1], [0.985, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={itemAnimatedStyle}>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-[14px] border px-4 py-4"
        onPress={onPress}
        style={{
          borderColor: withAlpha(palette.primary, 0.16),
          backgroundColor: palette.panelInset,
        }}>
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(palette.primary, 0.12) }}>
          {loading ? (
            <Spinner color={palette.primary} size="sm" />
          ) : (
            <AppIcon color={palette.primary} name={icon} size={19} />
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className={typography.body} style={{ color: palette.text }}>
            {label}
          </Text>
          <Text className={`${typography.bodySmall} mt-1`} style={{ color: palette.textSoft }}>
            {description}
          </Text>
        </View>
        <AppIcon color={palette.textSoft} name="chevron-right" size={16} />
      </Pressable>
    </Animated.View>
  );
}

function NewTabButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  const { t } = useI18n();
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, {
      duration: 220,
      easing: active ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
    });
  }, [active, activeProgress]);

  const plusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(activeProgress.value, [0, 1], [0, 45])}deg` },
      { scale: interpolate(activeProgress.value, [0, 1], [1, 0.92]) },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(activeProgress.value, [0, 1], [0, -3]) },
      { scale: interpolate(activeProgress.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const handlePress = () => {
    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={t('新建')}
      accessibilityRole="button"
      className="flex-1 items-center justify-center"
      onPress={handlePress}
      style={{ marginTop: -10 }}>
      <Animated.View
        className="h-16 w-16 items-center justify-center rounded-full border"
        style={[
          {
            borderColor: withAlpha(active ? palette.primary : palette.cta, active ? 0.54 : 0.38),
            backgroundColor: palette.cta,
            shadowColor: palette.shadow,
            shadowOpacity: active ? 0.32 : 0.26,
            shadowRadius: active ? 22 : 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 16,
          },
          buttonAnimatedStyle,
        ]}>
        <Animated.View style={plusAnimatedStyle}>
          <AppIcon color="#FFFFFF" name="plus" size={24} strokeWidth={2.4} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
function NewTabPlaceholder() {
  return <View style={{ flex: 1 }} />;
}

export function MainNavigator() {
  const tabNavigationRef = useRef<any>(null);
  const { isTablet } = useDeviceType();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isSidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const isSidebarHidden = useUIStore(state => state.sidebarHidden);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const folders = useFolderStore(state => state.folders);
  const rememberedFolderId = useFolderStore(state => state.activeFolderId);
  const createFolder = useFolderStore(state => state.createFolder);
  const fetchFolders = useFolderStore(state => state.fetchFolders);
  const activeFolderId = useNoteStore(state => state.activeFolderId);
  const createNote = useNoteStore(state => state.createNote);
  const fetchNotes = useNoteStore(state => state.fetchNotes);
  const fetchTags = useNoteStore(state => state.fetchTags);
  const setActiveFolderView = useNoteStore(state => state.setActiveFolderView);
  const syncNow = useSyncStore(state => state.syncNow);

  const [isCreateMenuVisible, setCreateMenuVisible] = useState(false);
  const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
  const [isFolderDialogVisible, setFolderDialogVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [importing, setImporting] = useState(false);

  const tabBarBottomPadding = Math.max(insets.bottom, MOBILE_TAB_BAR_MIN_BOTTOM_PADDING);
  const createSheetBottomOffset = MOBILE_TAB_BAR_BASE_HEIGHT + tabBarBottomPadding + 10;
  const isBusy = creatingNote || creatingFolder || importing;
  const createMenuProgress = useSharedValue(0);

  const mobileTabBarStyle = useMemo(
    () => createMobileTabBarStyle(palette, tabBarBottomPadding),
    [palette, tabBarBottomPadding],
  );
  const createMenuBackdropStyle = useAnimatedStyle(() => ({
    opacity: createMenuProgress.value,
  }));
  const createMenuSheetStyle = useAnimatedStyle(() => ({
    opacity: createMenuProgress.value,
    transform: [
      { translateY: interpolate(createMenuProgress.value, [0, 1], [34, 0]) },
      { scale: interpolate(createMenuProgress.value, [0, 1], [0.965, 1]) },
    ],
  }));
  const resolveDrawerStyle = (hidden: boolean) => ({
    width: hidden ? 0 : isSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH,
    backgroundColor: hidden ? 'transparent' : palette.panelStrong,
    borderRightColor: hidden ? 'transparent' : palette.borderStrong,
    borderRightWidth: hidden ? 0 : 1,
    overflow: 'hidden' as const,
  });

  const handleSidebarToggle = () => toggleSidebar();

  const openCreateMenu = useCallback(() => {
    if (isBusy || isCreateMenuOpen) {
      return;
    }

    createMenuProgress.value = 0;
    setCreateMenuVisible(true);
    setCreateMenuOpen(true);
    createMenuProgress.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [createMenuProgress, isBusy, isCreateMenuOpen]);

  const closeCreateMenu = useCallback(() => {
    if (!isCreateMenuVisible && !isCreateMenuOpen) {
      return;
    }

    setCreateMenuOpen(false);
    createMenuProgress.value = withTiming(
      0,
      {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      },
      finished => {
        if (finished) {
          runOnJS(setCreateMenuVisible)(false);
        }
      },
    );
  }, [createMenuProgress, isCreateMenuOpen, isCreateMenuVisible]);

  const navigateToNotes = useCallback(
    (screen?: 'Workspace' | 'NoteEditor', params?: Record<string, unknown>) => {
      if (!tabNavigationRef.current) {
        return;
      }

      if (!screen) {
        tabNavigationRef.current.navigate('NotesTab');
        return;
      }

      tabNavigationRef.current.navigate('NotesTab', { params, screen });
    },
    [],
  );

  const handleCreateNote = useCallback(async () => {
    const folderId = resolveCreateFolderId(activeFolderId, rememberedFolderId, folders);
    closeCreateMenu();

    if (!folderId) {
      Alert.alert(t('新建失败'), t('请先创建至少一个文件夹，再新建笔记。'));
      return;
    }

    setCreatingNote(true);

    try {
      const note = await createNote(folderId);
      navigateToNotes('NoteEditor', { noteId: note.id });
    } catch (error) {
      Alert.alert(t('新建失败'), getErrorMessage(error, t('新建笔记失败，请稍后重试。')));
    } finally {
      setCreatingNote(false);
    }
  }, [activeFolderId, closeCreateMenu, createNote, folders, navigateToNotes, rememberedFolderId, t]);

  const handleImportNotes = useCallback(async () => {
    closeCreateMenu();
    setImporting(true);

    try {
      const importResult = await pickAndImportNotes();

      if (!importResult) {
        return;
      }

      const syncResult = await syncNow();
      await Promise.all([fetchFolders(), fetchTags(), fetchNotes()]);
      navigateToNotes('Workspace');

      if (syncResult.status === 'success' || syncResult.status === 'already_syncing') {
        Alert.alert(t('导入完成'), describeImportNotesResult(importResult));
        return;
      }

      Alert.alert(
        t('导入已提交'),
        syncResult.status === 'offline'
          ? t('文件已经上传，但当前处于离线状态，请稍后联网后同步本地列表。')
          : syncResult.message ?? describeImportNotesResult(importResult),
      );
    } catch (error) {
      Alert.alert(t('导入失败'), getErrorMessage(error, t('导入笔记失败，请稍后重试。')));
    } finally {
      setImporting(false);
    }
  }, [closeCreateMenu, fetchFolders, fetchNotes, fetchTags, navigateToNotes, syncNow, t]);

  const handleOpenFolderDialog = useCallback(() => {
    closeCreateMenu();
    setFolderName('');
    setFolderDialogVisible(true);
  }, [closeCreateMenu]);

  const handleCreateFolder = useCallback(async () => {
    const trimmedFolderName = folderName.trim();

    if (!trimmedFolderName) {
      return;
    }

    setCreatingFolder(true);

    try {
      const folder = await createFolder(trimmedFolderName);
      setActiveFolderView(folder.id);
      setFolderDialogVisible(false);
      setFolderName('');
      navigateToNotes('Workspace');
    } catch (error) {
      Alert.alert(t('创建失败'), getErrorMessage(error, t('操作失败，请稍后重试。')));
    } finally {
      setCreatingFolder(false);
    }
  }, [createFolder, folderName, navigateToNotes, setActiveFolderView, t]);

  const getTabIcon = (
    routeName: keyof MainTabParamList,
    color: string,
    focused: boolean,
  ) => {
    if (routeName === 'NotesTab') {
      return <AppIcon color={color} name="notes" size={20} strokeWidth={focused ? 2.3 : 2} />;
    }

    if (routeName === 'SearchTab') {
      return <AppIcon color={color} name="search" size={20} strokeWidth={focused ? 2.3 : 2} />;
    }

    if (routeName === 'CommunityTab') {
      return (
        <AppIcon color={color} name="community" size={20} strokeWidth={focused ? 2.3 : 2} />
      );
    }

    return <AppIcon color={color} name="user" size={20} strokeWidth={focused ? 2.3 : 2} />;
  };

  if (isTablet) {
    return (
      <Drawer.Navigator
          drawerContent={() =>
            isSidebarHidden ? null : (
              <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={handleSidebarToggle} />
            )
          }
        screenOptions={{
          headerShown: false,
          drawerType: 'permanent',
          overlayColor: 'transparent',
          sceneStyle: { backgroundColor: palette.canvas },
          drawerStyle: resolveDrawerStyle(isSidebarHidden),
        }}>
        <Drawer.Screen
          name="Workspace"
          component={NoteStack}
          options={({ route }) => {
            const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'Workspace';
            const hideSidebar = isSidebarHidden || focusedRoute === 'NoteEditor';

            return {
              drawerStyle: resolveDrawerStyle(hideSidebar),
            };
          }}
        />
        <Drawer.Screen name="Community" component={CommunityStack} />
        <Drawer.Screen name="Settings" component={SettingsScreenLazy} />
      </Drawer.Navigator>
    );
  }

  return (
    <>
      <Tab.Navigator
        screenListeners={({ navigation }) => {
          tabNavigationRef.current = navigation;
          return {};
        }}
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
          tabBarStyle: mobileTabBarStyle,
          tabBarIcon:
            route.name === 'NewTab'
              ? undefined
              : ({ color, focused }) => (
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
          name="SearchTab"
          component={SearchStack}
          options={({ route }) => {
            const focusedRoute = getFocusedRouteNameFromRoute(route);
            const isEditing = focusedRoute === 'NoteEditor';
            return {
              title: t('搜索'),
              ...(isEditing && {
                tabBarStyle: { display: 'none' as const },
              }),
            };
          }}
        />
        <Tab.Screen
          name="NewTab"
          component={NewTabPlaceholder}
          listeners={{
            tabPress: event => {
              event.preventDefault();
              openCreateMenu();
            },
          }}
          options={{
            title: t('新建'),
            tabBarButton: () => (
              <NewTabButton
                active={isCreateMenuOpen}
                onPress={() => {
                  if (isCreateMenuOpen) {
                    closeCreateMenu();
                    return;
                  }

                  openCreateMenu();
                }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="CommunityTab"
          component={CommunityStack}
          options={({ route }) => {
            const focusedRoute = getFocusedRouteNameFromRoute(route);
            const isNested =
              focusedRoute === 'CreatePost' ||
              focusedRoute === 'PostDetail' ||
              focusedRoute === 'UserProfile';
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
          options={{ title: t('我的'), tabBarStyle: mobileTabBarStyle }}
        />
      </Tab.Navigator>

      <Modal
        animationType="none"
        transparent
        visible={isCreateMenuVisible}
        onRequestClose={closeCreateMenu}>
        <Pressable
          className="flex-1 justify-end"
          onPress={closeCreateMenu}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.overlay },
              createMenuBackdropStyle,
            ]}
          />
          <Animated.View
            style={[
              { paddingBottom: createSheetBottomOffset, paddingHorizontal: 16 },
              createMenuSheetStyle,
            ]}>
            <Pressable onPress={event => event.stopPropagation()}>
            <GlassPanel className="px-4 py-4" highlight={palette.primary}>
              <SectionEyebrow>{t('新建')}</SectionEyebrow>
              <Text className={`${typography.h3} mt-2`} style={{ color: palette.text }}>
                {t('新建内容')}
              </Text>
              <Text className={`${typography.bodySmall} mt-1`} style={{ color: palette.textSoft }}>
                {t('从这里快速开始一条笔记、导入内容或整理文件夹。')}
              </Text>

              <View className="mt-4 gap-3">
                <NewActionItem
                  description={t('立刻进入编辑器，开始记录代码或想法。')}
                  icon="notes"
                  index={0}
                  label={t('新建笔记')}
                  loading={creatingNote}
                  menuProgress={createMenuProgress}
                  onPress={() => {
                    void handleCreateNote();
                  }}
                />
                <NewActionItem
                  description={t('从 Markdown 或 JSON 导入已有内容。')}
                  icon="upload"
                  index={1}
                  label={t('导入内容')}
                  loading={importing}
                  menuProgress={createMenuProgress}
                  onPress={() => {
                    void handleImportNotes();
                  }}
                />
                <NewActionItem
                  description={t('先整理结构，再把笔记放进合适的位置。')}
                  icon="folder"
                  index={2}
                  label={t('新建文件夹')}
                  loading={creatingFolder}
                  menuProgress={createMenuProgress}
                  onPress={handleOpenFolderDialog}
                />
              </View>
            </GlassPanel>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isFolderDialogVisible}
        onRequestClose={() => {
          if (!creatingFolder) {
            setFolderDialogVisible(false);
          }
        }}>
        <Pressable
          className="flex-1 items-center justify-center px-6"
          onPress={() => {
            if (!creatingFolder) {
              setFolderDialogVisible(false);
            }
          }}
          style={{ backgroundColor: palette.overlay }}>
          <Pressable
            className="w-full max-w-[360px]"
            onPress={event => event.stopPropagation()}>
            <GlassPanel className="px-5 py-5" highlight={palette.primary}>
              <SectionEyebrow>{t('文件夹')}</SectionEyebrow>
              <Text className={`${typography.h3} mt-2`} style={{ color: palette.text }}>
                {t('新建文件夹')}
              </Text>
              <Text className={`${typography.bodySmall} mt-1`} style={{ color: palette.textSoft }}>
                {t('先给它一个清晰名字，后续整理会轻松很多。')}
              </Text>

              <View
                className="mt-4 rounded-[14px] border px-4 py-3"
                style={{
                  borderColor: withAlpha(palette.primary, 0.16),
                  backgroundColor: palette.panelInset,
                }}>
                <TextInput
                  autoFocus
                  onChangeText={setFolderName}
                  placeholder={t('文件夹名称')}
                  placeholderTextColor={palette.placeholder}
                  returnKeyType="done"
                  style={{ color: palette.text, fontSize: 15, padding: 0 }}
                  value={folderName}
                  onSubmitEditing={() => {
                    void handleCreateFolder();
                  }}
                />
              </View>

              <View className="mt-4 flex-row gap-3">
                <Button
                  className="flex-1"
                  isDisabled={creatingFolder}
                  variant="outline"
                  onPress={() => setFolderDialogVisible(false)}>
                  {t('取消')}
                </Button>
                <Button
                  className="flex-1"
                  isDisabled={creatingFolder || folderName.trim().length === 0}
                  variant="primary"
                  onPress={() => {
                    void handleCreateFolder();
                  }}>
                  {creatingFolder ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>{t('创建中...')}</Button.Label>
                    </>
                  ) : (
                    t('创建')
                  )}
                </Button>
              </View>
            </GlassPanel>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  settingsFallbackBlock: {
    opacity: 0.88,
  },
  settingsFallbackRowDivider: {
    borderTopWidth: 1,
  },
  settingsFallbackLineShort: {
    width: '42%',
  },
  settingsFallbackLineMedium: {
    width: '54%',
  },
  settingsFallbackLineDefault: {
    width: '52%',
  },
  settingsFallbackLineLong: {
    width: '68%',
  },
  settingsTabletFallback: {
    paddingTop: 24,
  },
});
