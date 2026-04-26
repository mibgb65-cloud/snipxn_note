import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n';
import { useAppTheme, withAlpha } from '../../theme';

import { AppIcon } from './AppIcon';
import { AppLogo } from './AppLogo';

interface OnboardingHomeTransitionProps {
  displayName?: string | null;
  onFinish: () => void;
}

const ENTER_DURATION_MS = 520;
const EXIT_DELAY_MS = 860;
const EXIT_DURATION_MS = 340;
const REDUCED_MOTION_EXIT_DELAY_MS = 260;
const REDUCED_MOTION_EXIT_DURATION_MS = 160;

export function OnboardingHomeTransition({
  displayName,
  onFinish,
}: OnboardingHomeTransitionProps) {
  const { width } = useWindowDimensions();
  const { isEnglish, t } = useI18n();
  const { palette, theme, typography } = useAppTheme();
  const [reducedMotion, setReducedMotion] = useState(false);

  const enterProgress = useSharedValue(0);
  const exitProgress = useSharedValue(0);
  const railProgress = useSharedValue(0);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (!mounted) {
          return;
        }

        setReducedMotion(enabled);

        if (enabled) {
          enterProgress.value = 1;
          railProgress.value = 1;
          exitProgress.value = withDelay(
            REDUCED_MOTION_EXIT_DELAY_MS,
            withTiming(1, { duration: REDUCED_MOTION_EXIT_DURATION_MS }, finished => {
              if (finished) {
                runOnJS(onFinish)();
              }
            }),
          );
          return;
        }

        enterProgress.value = withTiming(1, {
          duration: ENTER_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
        railProgress.value = withDelay(
          180,
          withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
        );
        exitProgress.value = withDelay(
          EXIT_DELAY_MS,
          withTiming(
            1,
            { duration: EXIT_DURATION_MS, easing: Easing.inOut(Easing.cubic) },
            finished => {
              if (finished) {
                runOnJS(onFinish)();
              }
            },
          ),
        );
      })
      .catch(() => {
        if (mounted) {
          enterProgress.value = 1;
          railProgress.value = 1;
          exitProgress.value = withDelay(
            REDUCED_MOTION_EXIT_DELAY_MS,
            withTiming(1, { duration: REDUCED_MOTION_EXIT_DURATION_MS }, finished => {
              if (finished) {
                runOnJS(onFinish)();
              }
            }),
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [enterProgress, exitProgress, onFinish, railProgress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exitProgress.value, [0, 1], [1, 0]),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [
      {
        translateY: reducedMotion
          ? 0
          : interpolate(enterProgress.value, [0, 1], [18, 0]),
      },
      {
        scale: reducedMotion
          ? 1
          : interpolate(enterProgress.value, [0, 1], [0.965, 1]),
      },
    ],
  }));

  const logoHaloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enterProgress.value, [0, 0.35, 1], [0, 0.52, 0.26]),
    transform: [
      {
        scale: reducedMotion
          ? 1
          : interpolate(enterProgress.value, [0, 1], [0.72, 1.08]),
      },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [
      {
        translateY: reducedMotion
          ? 0
          : interpolate(enterProgress.value, [0, 1], [6, 0]),
      },
      {
        scale: reducedMotion
          ? 1
          : interpolate(enterProgress.value, [0, 1], [0.78, 1]),
      },
    ],
  }));

  const trimmedDisplayName = displayName?.trim();
  const title = trimmedDisplayName
    ? isEnglish
      ? `Welcome, ${trimmedDisplayName}`
      : `欢迎，${trimmedDisplayName}`
    : t('欢迎来到 Snipxn');
  const contentWidth = Math.min(width - 56, 320);
  const railWidth = contentWidth - 58;
  const railStyle = useAnimatedStyle(() => ({
    width: interpolate(railProgress.value, [0, 1], [0, railWidth]),
  }));
  const isDark = theme === 'dark';
  const transitionColors = {
    background: isDark ? palette.canvas : '#F7FCFD',
    gridPrimary: withAlpha(palette.primary, isDark ? 0.12 : 0.16),
    gridSupport: withAlpha(palette.support, isDark ? 0.1 : 0.12),
    halo: withAlpha(palette.primary, isDark ? 0.2 : 0.16),
    badgeBackground: isDark ? palette.primaryStrong : palette.primary,
    railTrack: withAlpha(palette.textMuted, isDark ? 0.14 : 0.16),
  };
  const primaryGridStyle = { backgroundColor: transitionColors.gridPrimary };
  const supportGridStyle = { backgroundColor: transitionColors.gridSupport };
  const overlayBackgroundStyle = { backgroundColor: transitionColors.background };
  const logoHaloBackgroundStyle = { backgroundColor: transitionColors.halo };
  const checkBadgeSurfaceStyle = {
    backgroundColor: transitionColors.badgeBackground,
    shadowColor: palette.primary,
    shadowOpacity: isDark ? 0.42 : 0.22,
  };

  return (
    <Animated.View
      accessibilityLabel={t('资料已保存，正在打开你的工作区。')}
      className="flex-1"
      style={[
        styles.overlay,
        overlayBackgroundStyle,
        overlayStyle,
      ]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.gridLine,
            styles.gridLineTop,
            primaryGridStyle,
          ]}
        />
        <View
          style={[
            styles.gridLine,
            styles.gridLineBottom,
            supportGridStyle,
          ]}
        />
        <View
          style={[
            styles.verticalRail,
            styles.verticalRailLeft,
            primaryGridStyle,
          ]}
        />
        <View
          style={[
            styles.verticalRail,
            styles.verticalRailRight,
            supportGridStyle,
          ]}
        />
      </View>

      <View className="flex-1 items-center justify-center px-7">
        <Animated.View style={[styles.content, { width: contentWidth }, contentStyle]}>
          <View className="h-32 w-32 items-center justify-center">
            <Animated.View
              style={[
                styles.logoHalo,
                logoHaloBackgroundStyle,
                logoHaloStyle,
              ]}
            />
            <AppLogo size={78} />
            <Animated.View
              className="absolute bottom-2 right-2 h-10 w-10 items-center justify-center rounded-full"
              style={[
                styles.checkBadge,
                checkBadgeSurfaceStyle,
                checkStyle,
              ]}>
              <AppIcon color="#FFFFFF" name="check-circle" size={22} strokeWidth={2.2} />
            </Animated.View>
          </View>

          <Text
            className={`${typography.h2} mt-6 text-center`}
            style={{ color: palette.text }}>
            {title}
          </Text>
          <Text
            className={`${typography.body} mt-2 text-center`}
            style={{ color: palette.textSoft }}>
            {t('资料已保存，正在打开你的工作区。')}
          </Text>

          <View
            className="mt-7 h-1 overflow-hidden rounded-full"
            style={{ width: railWidth, backgroundColor: transitionColors.railTrack }}>
            <Animated.View
              className="h-1 rounded-full"
              style={[{ backgroundColor: palette.primary }, railStyle]}
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 40,
    overflow: 'hidden',
    zIndex: 40,
  },
  content: {
    alignItems: 'center',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  gridLineTop: {
    top: '30%',
  },
  gridLineBottom: {
    top: '66%',
  },
  verticalRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  verticalRailLeft: {
    left: 34,
  },
  verticalRailRight: {
    right: 42,
  },
  checkBadge: {
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
  },
  logoHalo: {
    position: 'absolute',
    height: 128,
    width: 128,
    borderRadius: 64,
  },
});
