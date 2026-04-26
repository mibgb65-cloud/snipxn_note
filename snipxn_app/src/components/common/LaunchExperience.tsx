import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import BootSplash from 'react-native-bootsplash';
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

import { AppLogo } from './AppLogo';

interface LaunchExperienceProps {
  ready: boolean;
  onFinish: () => void;
}

const INTRO_DURATION_MS = 1780;
const EXIT_DURATION_MS = 460;

export function LaunchExperience({ ready, onFinish }: LaunchExperienceProps) {
  const { width } = useWindowDimensions();
  const { palette, theme, typography } = useAppTheme();
  const { t } = useI18n();
  const [introDone, setIntroDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const finishedRef = useRef(false);

  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.78);
  const coreOpacity = useSharedValue(0);
  const coreScale = useSharedValue(0.7);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.72);
  const wordOpacity = useSharedValue(0);
  const wordTranslate = useSharedValue(12);
  const railProgress = useSharedValue(0);
  const sweepProgress = useSharedValue(0);
  const statusOpacity = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    let introTimer: ReturnType<typeof setTimeout> | null = null;

    void BootSplash.hide({ fade: true });

    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (!mounted) {
        return;
      }

      setReducedMotion(enabled);

      if (enabled) {
        logoOpacity.value = 1;
        logoScale.value = 1;
        coreOpacity.value = 1;
        coreScale.value = 1;
        ringOpacity.value = 0.6;
        ringScale.value = 1;
        wordOpacity.value = 1;
        wordTranslate.value = 0;
        railProgress.value = 1;
        statusOpacity.value = 1;
        setIntroDone(true);
        return;
      }

      coreOpacity.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
      coreScale.value = withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) });
      ringOpacity.value = withDelay(160, withTiming(0.72, { duration: 520, easing: Easing.out(Easing.cubic) }));
      ringScale.value = withDelay(160, withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) }));
      logoOpacity.value = withDelay(260, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }));
      logoScale.value = withDelay(260, withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) }));
      sweepProgress.value = withDelay(620, withTiming(1, { duration: 760, easing: Easing.inOut(Easing.cubic) }));
      wordOpacity.value = withDelay(900, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
      wordTranslate.value = withDelay(900, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
      railProgress.value = withDelay(1040, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
      statusOpacity.value = withDelay(1260, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));

      introTimer = setTimeout(() => {
        if (mounted) {
          setIntroDone(true);
        }
      }, INTRO_DURATION_MS);
    });

    return () => {
      mounted = false;
      if (introTimer) {
        clearTimeout(introTimer);
      }
    };
  }, [
    coreOpacity,
    coreScale,
    logoOpacity,
    logoScale,
    railProgress,
    ringOpacity,
    ringScale,
    statusOpacity,
    sweepProgress,
    wordOpacity,
    wordTranslate,
  ]);

  useEffect(() => {
    if (!ready || !introDone || finishedRef.current) {
      return;
    }

    finishedRef.current = true;

    if (reducedMotion) {
      containerOpacity.value = withTiming(0, { duration: 140 }, finished => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
      return;
    }

    statusOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) });
    containerScale.value = withTiming(1.035, { duration: EXIT_DURATION_MS, easing: Easing.inOut(Easing.cubic) });
    containerOpacity.value = withTiming(
      0,
      { duration: EXIT_DURATION_MS, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) {
          runOnJS(onFinish)();
        }
      },
    );
  }, [containerOpacity, containerScale, introDone, onFinish, ready, reducedMotion, statusOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: coreOpacity.value,
    transform: [{ scale: coreScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordTranslate.value }],
  }));

  const railStyle = useAnimatedStyle(() => ({
    opacity: interpolate(railProgress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [{ scaleX: railProgress.value }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sweepProgress.value, [0, 0.12, 0.82, 1], [0, 0.92, 0.92, 0]),
    transform: [
      { translateX: interpolate(sweepProgress.value, [0, 1], [-150, 150]) },
      { rotate: '-18deg' },
    ],
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
    transform: [{ translateY: interpolate(statusOpacity.value, [0, 1], [8, 0]) }],
  }));

  const railWidth = Math.min(width - 88, 280);
  const isDark = theme === 'dark';
  const launchColors = {
    background: isDark ? palette.canvas : '#F7FCFD',
    gridPrimary: withAlpha(palette.primary, isDark ? 0.12 : 0.16),
    gridSupport: withAlpha(palette.support, isDark ? 0.1 : 0.12),
    verticalPrimary: withAlpha(palette.primary, isDark ? 0.11 : 0.13),
    verticalSupport: withAlpha(palette.support, isDark ? 0.08 : 0.1),
    cornerPrimary: withAlpha(palette.primary, isDark ? 0.34 : 0.3),
    cornerSupport: withAlpha(palette.support, isDark ? 0.3 : 0.24),
    coreBorder: withAlpha(palette.primary, isDark ? 0.2 : 0.18),
    coreBackground: withAlpha(palette.primaryStrong, isDark ? 0.1 : 0.07),
    ring: withAlpha(palette.accent, isDark ? 0.58 : 0.46),
    sweep: withAlpha(isDark ? '#FFFFFF' : palette.primary, isDark ? 0.76 : 0.34),
    brandShadow: withAlpha(palette.primary, isDark ? 0.38 : 0.22),
    railTrack: withAlpha(palette.textMuted, isDark ? 0.14 : 0.16),
  };

  return (
    <Animated.View
      accessibilityLabel={t('正在恢复本地会话与同步状态...')}
      className="flex-1"
      style={[styles.container, { backgroundColor: launchColors.background }, containerStyle]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.gridLine, styles.gridLineTop, { backgroundColor: launchColors.gridPrimary }]} />
        <View style={[styles.gridLine, styles.gridLineMiddle, { backgroundColor: launchColors.gridSupport }]} />
        <View style={[styles.verticalRail, { left: 34, backgroundColor: launchColors.verticalPrimary }]} />
        <View style={[styles.verticalRail, { right: 42, backgroundColor: launchColors.verticalSupport }]} />
        <View style={[styles.cornerMark, styles.cornerMarkTopLeft, { borderColor: launchColors.cornerPrimary }]} />
        <View style={[styles.cornerMark, styles.cornerMarkBottomRight, { borderColor: launchColors.cornerSupport }]} />
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center">
          <View className="h-40 w-40 items-center justify-center">
            <Animated.View
              style={[
                styles.logoCore,
                {
                  borderColor: launchColors.coreBorder,
                  backgroundColor: launchColors.coreBackground,
                },
                coreStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.logoRing,
                {
                  borderColor: launchColors.ring,
                },
                ringStyle,
              ]}
            />
            <Animated.View style={[styles.sweepMask, sweepStyle]}>
              <View style={[styles.sweep, { backgroundColor: launchColors.sweep }]} />
            </Animated.View>
            <Animated.View style={logoStyle}>
              <AppLogo size={104} />
            </Animated.View>
          </View>

          <Animated.View className="mt-7 items-center" style={wordStyle}>
            <Text
              style={[
                styles.brand,
                {
                  color: palette.text,
                  textShadowColor: launchColors.brandShadow,
                },
              ]}>
              Snipxn
            </Text>
            <Text className={`${typography.bodySmall} mt-2 text-center`} style={{ color: palette.textSoft }}>
              {t('代码笔记，专注同步')}
            </Text>
          </Animated.View>

          <Animated.View className="mt-8 items-center" style={statusStyle}>
            <View
              style={[
                styles.rail,
                {
                  width: railWidth,
                  backgroundColor: launchColors.railTrack,
                },
              ]}>
              <Animated.View
                style={[
                  styles.railFill,
                  {
                    backgroundColor: palette.primary,
                    shadowColor: palette.primary,
                  },
                  railStyle,
                ]}
              />
            </View>
            <Text className={`${typography.caption} mt-3 text-center`} style={{ color: palette.textMuted }}>
              {ready ? t('工作区已就绪') : t('正在恢复本地会话与同步状态...')}
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  gridLineTop: {
    top: '26%',
  },
  gridLineMiddle: {
    top: '62%',
  },
  verticalRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  cornerMark: {
    position: 'absolute',
    width: 54,
    height: 54,
  },
  cornerMarkTopLeft: {
    left: 22,
    top: 42,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  cornerMarkBottomRight: {
    right: 22,
    bottom: 42,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  logoCore: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    borderWidth: 1,
  },
  logoRing: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.4,
  },
  sweepMask: {
    position: 'absolute',
    width: 74,
    height: 170,
    overflow: 'hidden',
    zIndex: 4,
  },
  sweep: {
    width: 22,
    height: 170,
  },
  brand: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 52,
    textShadowRadius: 24,
  },
  rail: {
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  railFill: {
    height: 3,
    borderRadius: 999,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
});
