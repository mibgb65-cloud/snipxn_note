import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Avatar } from 'heroui-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { API_BASE_URL } from '../../api/axios';
import { useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore, useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import { GlassPanel, IconBadge, SectionEyebrow } from '../common/AppChrome';
import { AppIcon, type AppIconName } from '../common/AppIcon';
import { APP_FADE_IN, APP_FADE_OUT, APP_LAYOUT_TRANSITION } from '../common/AppMotion';

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

  if (collapsed) {
    return (
      <Animated.View className="self-center" layout={APP_LAYOUT_TRANSITION}>
        <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-[10px]"
            onPress={onPress}
            style={{ backgroundColor: compactBackgroundColor }}>
            <AppIcon
              color={active ? palette.primary : palette.textMuted}
              name={icon}
              size={SIDEBAR_ICON_SIZE}
              strokeWidth={2}
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="overflow-hidden rounded-[10px]" layout={APP_LAYOUT_TRANSITION}>
      <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          className="w-full rounded-[10px] border px-3 py-3"
          onPress={onPress}
          style={{
            borderColor,
            backgroundColor: expandedBackgroundColor,
          }}>
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
        </Pressable>
      </Animated.View>
    </Animated.View>
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
      <GlassPanel className="items-center gap-2.5 px-2.5 py-2.5" variant="inset">
        <View
          accessibilityLabel={`${t('云空间')} ${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`}
          className="w-full items-center gap-1.5">
          <Text className={typography.caption} style={{ color: palette.textMuted }}>
            {t('云空间')}
          </Text>
          <View
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: palette.surfaceAlt }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: palette.primary }}
            />
          </View>
          <Text className={typography.caption} style={{ color: palette.textSoft }}>
            {Math.round(progress * 100)}%
          </Text>
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
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="px-3 py-2.5" variant="inset">
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
    </GlassPanel>
  );
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse: () => void;
}) {
  const navigation = useNavigation<any>();
  const routeName = useNavigationState(state => state.routes[state.index]?.name ?? 'Workspace');
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

  return (
    <View className="flex-1" style={{ backgroundColor: palette.panelStrong }}>
      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{
          paddingHorizontal: collapsed ? 12 : 16,
          paddingTop: collapsed ? 12 : 20,
          paddingBottom: collapsed ? 12 : 16,
        }}>
        {collapsed ? (
          <Animated.View className="items-center" entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
            <UtilityButton
              icon="panel-left-open"
              label={t('展开侧边栏')}
              onPress={onToggleCollapse}
              size="tiny"
            />
          </Animated.View>
        ) : (
          <Animated.View entering={APP_FADE_IN} exiting={APP_FADE_OUT}>
            <GlassPanel className="px-4 py-4" highlight={palette.primary}>
              <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <IconBadge icon="notes" iconSize={18} size={44} round />
                  <View className="min-w-0 flex-1">
                    <SectionEyebrow>Workspace</SectionEyebrow>
                    <Text className={typography.h3} numberOfLines={1} style={{ color: palette.text }}>
                      {APP_NAME}
                    </Text>
                    <Text className={typography.bodySmall} numberOfLines={1} style={{ color: palette.textSoft }}>
                      {APP_SUBTITLE}
                    </Text>
                  </View>
                </View>

                <UtilityButton
                  icon="panel-left-close"
                  label={t('收起侧边栏')}
                  onPress={onToggleCollapse}
                  size="tiny"
                />
              </View>
            </GlassPanel>
          </Animated.View>
        )}
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          layout={APP_LAYOUT_TRANSITION}
          style={{
            paddingHorizontal: collapsed ? 12 : 16,
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
                onPress={() => navigation.navigate('Workspace')}
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
                  navigation.navigate('Workspace');
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
                  navigation.navigate('Workspace');
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
                  navigation.navigate('Workspace');
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

      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{
          backgroundColor: palette.panelStrong,
          paddingHorizontal: collapsed ? 12 : 16,
          paddingTop: collapsed ? 16 : 12,
          paddingBottom: collapsed ? 16 : 14,
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
