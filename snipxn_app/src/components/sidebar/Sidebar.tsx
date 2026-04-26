import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Avatar } from 'heroui-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../../api/axios';
import { useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore, useCommunityStore, useNoteStore, type CommunityFeedTab } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import { GlassPanel, IconBadge } from '../common/AppChrome';
import { AppIcon, type AppIconName } from '../common/AppIcon';
import { APP_FADE_IN, APP_FADE_OUT, APP_LAYOUT_TRANSITION } from '../common/AppMotion';
import { NoteList } from '../note/NoteList';

import { FolderList } from './FolderList';
import { TagList } from './TagList';

const APP_NAME = 'Snipxn';
const APP_SUBTITLE = 'Code Notes Workspace';
const SIDEBAR_ICON_SIZE = 17;
const SIDEBAR_UTILITY_ICON_SIZE = {
  tiny: 14,
  compact: 15,
  default: 16,
} as const;
const WORKSPACE_SWITCH_TIMING = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};
const SIDEBAR_CONTEXT_ENTERING = FadeInDown.duration(180).easing(Easing.out(Easing.cubic));

function resolveAvatarUri(avatar: string | null): string | null {
  if (!avatar) {
    return null;
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiOrigin}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

function getAvatarFallback(nickname: string | null | undefined, email: string | undefined): string {
  const source = nickname?.trim() || email?.trim() || 'S';
  return source.slice(0, 1).toUpperCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

function SidebarSectionTitle({
  title,
  collapsed,
}: {
  title: string;
  collapsed: boolean;
}) {
  const { palette, typography } = useAppTheme();

  if (collapsed) {
    return null;
  }

  return (
    <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
      <Text className={typography.caption} style={{ color: palette.textSoft }}>
        {title}
      </Text>
    </Animated.View>
  );
}

function UtilityButton({
  icon,
  label,
  onPress,
  size = 'default',
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  size?: 'default' | 'compact' | 'tiny';
}) {
  const { palette } = useAppTheme();
  const buttonClassName =
    size === 'tiny' ? 'h-9 w-9' : size === 'compact' ? 'h-10 w-10' : 'h-11 w-11';
  const iconSize = SIDEBAR_UTILITY_ICON_SIZE[size];

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`${buttonClassName} items-center justify-center rounded-full border`}
      hitSlop={8}
      onPress={onPress}
      style={{
        borderColor: withAlpha(palette.primary, 0.16),
        backgroundColor: palette.panelRaised,
      }}>
      <AppIcon color={palette.textMuted} name={icon} size={iconSize} />
    </Pressable>
  );
}

function SidebarItem({
  label,
  icon,
  active,
  collapsed,
  onPress,
}: {
  label: string;
  icon: AppIconName;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const compactBackgroundColor = active ? withAlpha(palette.primary, 0.14) : 'transparent';
  const expandedBackgroundColor = active ? withAlpha(palette.primary, 0.08) : 'transparent';
  const borderColor = active ? withAlpha(palette.primary, 0.22) : 'transparent';

  return (
    <Animated.View
      className={collapsed ? 'self-center' : 'overflow-hidden rounded-[10px]'}
      layout={APP_LAYOUT_TRANSITION}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        className={
          collapsed
            ? 'h-11 w-11 items-center justify-center rounded-[10px]'
            : 'w-full rounded-[10px] border px-3 py-3'
        }
        onPress={onPress}
        style={{
          borderColor: collapsed ? 'transparent' : borderColor,
          backgroundColor: collapsed ? compactBackgroundColor : expandedBackgroundColor,
        }}>
        {collapsed ? (
          <AppIcon
            color={active ? palette.primary : palette.textMuted}
            name={icon}
            size={SIDEBAR_ICON_SIZE}
            strokeWidth={2}
          />
        ) : (
          <View className="flex-row items-center">
            <View
              className="mr-2.5 h-7 w-1 rounded-full"
              style={{ backgroundColor: active ? palette.primary : 'transparent' }}
            />
            <View className="h-8 w-8 items-center justify-center">
              <AppIcon
                color={active ? palette.primary : palette.textMuted}
                name={icon}
                size={SIDEBAR_ICON_SIZE}
                strokeWidth={2}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className={typography.body}
                numberOfLines={1}
                style={{ color: active ? palette.text : palette.textMuted }}>
                {label}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function WorkspaceSwitch({
  activeRoute,
  onOpenCommunity,
  onOpenWorkspace,
}: {
  activeRoute: string;
  onOpenCommunity: () => void;
  onOpenWorkspace: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const [switchWidth, setSwitchWidth] = useState(0);
  const activeIndex = activeRoute === 'Community' ? 1 : 0;
  const activeProgress = useSharedValue(activeIndex);
  const indicatorWidth = Math.max(0, (switchWidth - 4) / 2);

  useEffect(() => {
    activeProgress.value = withTiming(activeIndex, WORKSPACE_SWITCH_TIMING);
  }, [activeIndex, activeProgress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth,
    transform: [{ translateX: activeProgress.value * indicatorWidth }],
  }));

  const items = [
    {
      active: activeRoute === 'Workspace',
      icon: 'notes' as const,
      label: t('工作区'),
      onPress: onOpenWorkspace,
    },
    {
      active: activeRoute === 'Community',
      icon: 'community' as const,
      label: t('社区'),
      onPress: onOpenCommunity,
    },
  ];

  return (
    <View
      className="flex-row overflow-hidden rounded-[9px] p-0.5"
      onLayout={event => setSwitchWidth(event.nativeEvent.layout.width)}
      style={{ backgroundColor: palette.panelInset, position: 'relative' }}>
      {indicatorWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 2,
              top: 2,
              bottom: 2,
              borderRadius: 7,
              backgroundColor: palette.panelRaised,
              shadowColor: palette.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {items.map(item => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-[7px] px-2 py-2"
          onPress={item.onPress}
          style={{ zIndex: 1 }}>
          <AppIcon
            color={item.active ? palette.primary : palette.textSoft}
            name={item.icon}
            size={15}
          />
          <Text
            className={typography.bodySmall}
            numberOfLines={1}
            style={{ color: item.active ? palette.text : palette.textSoft }}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function CommunityFeedControls({
  activeChildRoute,
  onNavigateFeed,
  onOpenComposer,
}: {
  activeChildRoute?: string;
  onNavigateFeed: () => void;
  onOpenComposer: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const {
    feedTab,
    feedSearchQuery,
    setFeedTab,
    setFeedSearchQuery,
  } = useCommunityStore(useShallow(state => ({
    feedTab: state.feedTab,
    feedSearchQuery: state.feedSearchQuery,
    setFeedTab: state.setFeedTab,
    setFeedSearchQuery: state.setFeedSearchQuery,
  })));
  const feedItems: Array<{ tab: CommunityFeedTab; icon: AppIconName; label: string }> = [
    { tab: 'latest', icon: 'refresh', label: t('最新') },
    { tab: 'hot', icon: 'flame', label: t('热榜') },
  ];

  const handleSelectTab = (tab: CommunityFeedTab) => {
    setFeedTab(tab);
    onNavigateFeed();
  };

  return (
    <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT} className="gap-4">
      <View>
        <View
          className="flex-row items-center gap-2 rounded-[10px] border px-3 py-2.5"
          style={{
            borderColor: withAlpha(palette.primary, 0.12),
            backgroundColor: palette.panelInset,
          }}>
          <AppIcon color={palette.textSoft} name="search" size={15} />
          <TextInput
            autoCapitalize="none"
            className={`${typography.bodySmall} flex-1`}
            onChangeText={value => {
              setFeedSearchQuery(value);
              onNavigateFeed();
            }}
            onFocus={onNavigateFeed}
            placeholder={t('搜索帖子、标签或作者')}
            placeholderTextColor={palette.placeholder}
            returnKeyType="search"
            style={{ color: palette.text, lineHeight: 18, paddingVertical: 0 }}
            value={feedSearchQuery}
          />
        </View>
      </View>

      <Pressable
        accessibilityLabel={t('发布帖子')}
        accessibilityRole="button"
        className="w-full flex-row items-center justify-center gap-2 rounded-[10px] border px-3 py-3"
        onPress={onOpenComposer}
        style={{
          borderColor: withAlpha(palette.primary, 0.22),
          backgroundColor:
            activeChildRoute === 'CreatePost' ? withAlpha(palette.primary, 0.16) : palette.primarySoft,
        }}>
        <AppIcon color={palette.primary} name="edit-3" size={16} strokeWidth={2.1} />
        <Text className={typography.bodySmall} style={{ color: palette.primary, fontWeight: '800' }}>
          {t('发布帖子')}
        </Text>
      </Pressable>

      <View className="gap-2">
        <SidebarSectionTitle collapsed={false} title={t('信息流')} />
        <View className="gap-1">
          {feedItems.map(item => (
            <SidebarItem
              key={item.tab}
              active={activeChildRoute !== 'CreatePost' && feedTab === item.tab}
              collapsed={false}
              icon={item.icon}
              label={item.label}
              onPress={() => handleSelectTab(item.tab)}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function WorkspaceFolderControls() {
  const { t } = useI18n();

  return (
    <View className="px-1 pb-4 pt-1">
      <View className="gap-2">
        <SidebarSectionTitle collapsed={false} title={t('文件夹')} />
        <FolderList />
      </View>
    </View>
  );
}

function AccountSummaryCard({
  collapsed,
  avatarUri,
  avatarFallback,
  onPressSettings,
}: {
  collapsed: boolean;
  avatarUri: string | null;
  avatarFallback: string;
  onPressSettings: () => void;
}) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();
  const user = useAuthStore(state => state.user);

  const storageUsed = user?.storageUsed ?? 0;
  const storageLimit = user?.storageLimit ?? 0;
  const progress = storageLimit > 0 ? Math.min(storageUsed / storageLimit, 1) : 0;

  if (collapsed) {
    return (
      <View className="items-center gap-3 px-2 py-2.5">
        <View
          accessibilityLabel={`${t('云空间')} ${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`}
          className="w-full items-center">
          <View
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: palette.surfaceAlt }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: palette.primary }}
            />
          </View>
        </View>
        <Avatar alt={t('用户头像')} size="sm">
          {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
          <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
        </Avatar>
        <UtilityButton
          size="tiny"
          icon="settings"
          label={t('打开设置')}
          onPress={onPressSettings}
        />
      </View>
    );
  }

  return (
    <View className="px-1 py-1.5">
      <View className="px-1 py-0.5">
        <View className="flex-row items-center gap-3">
          <View
            className="h-7 w-7 items-center justify-center rounded-[7px]"
            style={{ backgroundColor: withAlpha(palette.primary, 0.12) }}>
            <AppIcon color={palette.primary} name="database" size={15} />
          </View>
          <View className="flex-1">
            <Text className={typography.bodySmall} style={{ color: palette.text }}>
              {t('云空间')}
            </Text>
            <Text className={typography.caption} style={{ color: palette.textSoft }}>
              {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
            </Text>
          </View>
          <Text className={typography.caption} style={{ color: palette.textMuted }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: palette.surfaceAlt }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${progress * 100}%`, backgroundColor: palette.primary }}
          />
        </View>
      </View>

      <View
        className="my-2 h-px"
        style={{ backgroundColor: withAlpha(palette.borderStrong, 0.7) }}
      />

      <View className="mt-2 flex-row items-center gap-2">
        <Avatar alt={t('用户头像')} size="sm">
          {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
          <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
        </Avatar>
        <View className="min-w-0 flex-1">
          <Text className={typography.bodySmall} numberOfLines={1} style={{ color: palette.text }}>
            {user?.nickname ?? t('未设置昵称')}
          </Text>
          <Text className={typography.caption} numberOfLines={1} style={{ color: palette.textSoft }}>
            {user?.email ?? t('未获取到账号')}
          </Text>
        </View>
        <UtilityButton
          size="tiny"
          icon="settings"
          label={t('打开设置')}
          onPress={onPressSettings}
        />
      </View>
    </View>
  );
}

export function Sidebar({
  collapsed = false,
  canToggleCollapse = true,
  compactWidth,
  workspaceListMode = false,
  expandedWidth,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  canToggleCollapse?: boolean;
  compactWidth?: number;
  workspaceListMode?: boolean;
  expandedWidth?: number;
  onToggleCollapse: () => void;
}) {
  const navigation = useNavigation<any>();
  const routeName = useNavigationState(state => state.routes[state.index]?.name ?? 'Workspace');
  const activeChildRoute = useNavigationState(state => {
    const route = state.routes[state.index] as any;
    const nestedState = route?.state;

    if (!nestedState?.routes?.length) {
      return route?.name === 'Community' ? 'Feed' : undefined;
    }

    const nestedIndex = nestedState.index ?? 0;
    return nestedState.routes[nestedIndex]?.name;
  });
  const insets = useSafeAreaInsets();
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  const user = useAuthStore(state => state.user);
  const { activeView, activeTagId, setActiveView, setActiveTagId } = useNoteStore(useShallow(state => ({
    activeView: state.activeView,
    activeTagId: state.activeTagId,
    setActiveView: state.setActiveView,
    setActiveTagId: state.setActiveTagId,
  })));

  const avatarUri = resolveAvatarUri(user?.avatar ?? null);
  const avatarFallback = getAvatarFallback(user?.nickname, user?.email);
  const showWorkspaceShell = workspaceListMode && !collapsed;
  const showWorkspaceList = showWorkspaceShell && routeName === 'Workspace';
  const showCommunityControls = showWorkspaceShell && routeName === 'Community';
  const headerTopPadding = Math.max(collapsed ? 14 : 20, insets.top + (collapsed ? 8 : 10));
  const stableSidebarWidth = collapsed ? compactWidth ?? '100%' : expandedWidth;

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: palette.panelStrong,
        width: stableSidebarWidth,
      }}>
      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{
          paddingHorizontal: collapsed ? 10 : 12,
          paddingTop: headerTopPadding,
          paddingBottom: collapsed ? 10 : 8,
        }}>
        {collapsed ? (
          <Animated.View className="items-center" entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
            {canToggleCollapse ? (
              <UtilityButton
                icon="panel-left-open"
                label={t('展开侧边栏')}
                onPress={onToggleCollapse}
                size="tiny"
              />
            ) : (
              <IconBadge icon="notes" iconSize={18} size={44} round />
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className={typography.h3} numberOfLines={1} style={{ color: palette.text }}>
                  {APP_NAME}
                </Text>
                <Text className={typography.caption} numberOfLines={1} style={{ color: palette.textSoft }}>
                  {APP_SUBTITLE}
                </Text>
              </View>

              {canToggleCollapse ? (
                <UtilityButton
                  icon="panel-left-close"
                  label={t('收起侧边栏')}
                  onPress={onToggleCollapse}
                  size="tiny"
                />
              ) : null}
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {showWorkspaceShell ? (
        <Animated.View
          layout={APP_LAYOUT_TRANSITION}
          style={{
            flex: 1,
            minHeight: 0,
            paddingHorizontal: 10,
            paddingBottom: 8,
          }}>
          <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
            <WorkspaceSwitch
              activeRoute={routeName}
              onOpenCommunity={() => navigation.navigate('Community')}
              onOpenWorkspace={() => navigation.navigate('Workspace', { screen: 'Workspace' })}
            />
          </Animated.View>

          <Animated.View
            entering={APP_FADE_IN}
            layout={APP_LAYOUT_TRANSITION}
            style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
            {showWorkspaceList ? (
              <Animated.View
                key="workspace-list-controls"
                entering={SIDEBAR_CONTEXT_ENTERING}
                exiting={APP_FADE_OUT}
                layout={APP_LAYOUT_TRANSITION}
                style={{ flex: 1, minHeight: 0 }}>
                <NoteList
                  createButtonMode="below"
                  headerComponent={<WorkspaceFolderControls />}
                  emptyHint={t('从左栏新建或导入内容后，会在这里出现。')}
                  emptyTitle={t('暂无笔记')}
                  itemPresentation="row"
                  layoutMode="list"
                  showCreateButton
                  showSearchHeader
                />
              </Animated.View>
            ) : showCommunityControls ? (
              <Animated.View
                key="community-feed-controls"
                entering={SIDEBAR_CONTEXT_ENTERING}
                exiting={APP_FADE_OUT}
                layout={APP_LAYOUT_TRANSITION}>
                <CommunityFeedControls
                  activeChildRoute={activeChildRoute}
                  onNavigateFeed={() => navigation.navigate('Community', { screen: 'Feed' })}
                  onOpenComposer={() => navigation.navigate('Community', { screen: 'CreatePost' })}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="community-summary-controls"
                className="px-2 py-4"
                entering={SIDEBAR_CONTEXT_ENTERING}
                exiting={APP_FADE_OUT}
                layout={APP_LAYOUT_TRANSITION}>
                <Text className={typography.h3} style={{ color: palette.text }}>
                  {t('社区')}
                </Text>
                <Text className={`${typography.bodySmall} mt-2`} style={{ color: palette.textSoft }}>
                  {t('动态、评论和个人主页。')}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View
            layout={APP_LAYOUT_TRANSITION}
            style={{
              paddingHorizontal: collapsed ? 10 : 12,
              paddingTop: collapsed ? 10 : 6,
              paddingBottom: 20,
            }}>
            <View className="gap-2">
              <SidebarSectionTitle collapsed={collapsed} title={t('导航')} />
              <GlassPanel className="px-2 py-2" variant="subtle">
                <SidebarItem
                  active={routeName === 'Workspace'}
                  collapsed={collapsed}
                  icon="notes"
                  label={t('工作区')}
                  onPress={() => navigation.navigate('Workspace', { screen: 'Workspace' })}
                />
                <SidebarItem
                  active={routeName === 'Community'}
                  collapsed={collapsed}
                  icon="community"
                  label={t('社区')}
                  onPress={() => navigation.navigate('Community')}
                />
              </GlassPanel>
            </View>

            <View className="mt-4 gap-2">
              <SidebarSectionTitle collapsed={collapsed} title={t('快捷视图')} />
              <GlassPanel className="px-2 py-2" variant="subtle">
                <SidebarItem
                  active={routeName === 'Workspace' && activeView === 'all' && activeTagId === null}
                  collapsed={collapsed}
                  icon="notes"
                  label={t('全部笔记')}
                  onPress={() => {
                    setActiveTagId(null);
                    setActiveView('all');
                    navigation.navigate('Workspace', { screen: 'Workspace' });
                  }}
                />
                <SidebarItem
                  active={routeName === 'Workspace' && activeView === 'starred'}
                  collapsed={collapsed}
                  icon="star"
                  label={t('收藏笔记')}
                  onPress={() => {
                    setActiveTagId(null);
                    setActiveView('starred');
                    navigation.navigate('Workspace', { screen: 'Workspace' });
                  }}
                />
                <SidebarItem
                  active={routeName === 'Workspace' && activeView === 'trash'}
                  collapsed={collapsed}
                  icon="trash"
                  label={t('回收站')}
                  onPress={() => {
                    setActiveTagId(null);
                    setActiveView('trash');
                    navigation.navigate('Workspace', { screen: 'Workspace' });
                  }}
                />
              </GlassPanel>
            </View>

            {collapsed ? null : (
              <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
                <View className="mt-4 gap-2">
                  <SidebarSectionTitle collapsed={collapsed} title={t('文件夹')} />
                  <GlassPanel className="px-2 py-2" variant="subtle">
                    <FolderList />
                  </GlassPanel>
                </View>

                <View className="mt-4 gap-2">
                  <SidebarSectionTitle collapsed={collapsed} title={t('标签')} />
                  <GlassPanel className="px-2 py-2" variant="subtle">
                    <TagList />
                  </GlassPanel>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      )}

      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{
          backgroundColor: palette.panelStrong,
          paddingHorizontal: collapsed ? 10 : 12,
          paddingTop: collapsed ? 14 : 10,
          paddingBottom: collapsed ? 14 : 12,
        }}>
        <AccountSummaryCard
          avatarFallback={avatarFallback}
          avatarUri={avatarUri}
          collapsed={collapsed}
          onPressSettings={() => navigation.navigate('Settings')}
        />
      </Animated.View>
    </View>
  );
}
