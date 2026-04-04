import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme, withAlpha } from '../../theme';

import { AppIcon, type AppIconName } from './AppIcon';

type CanvasProps = PropsWithChildren<{
  className?: string;
  style?: StyleProp<ViewStyle>;
  decorative?: boolean;
}>;

type GlassPanelProps = PropsWithChildren<{
  className?: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'raised' | 'strong' | 'subtle' | 'inset';
  highlight?: string | null;
}>;

function getPanelBackground(
  variant: NonNullable<GlassPanelProps['variant']>,
  palette: ReturnType<typeof useAppTheme>['palette'],
) {
  if (variant === 'strong') {
    return palette.panelStrong;
  }

  if (variant === 'subtle') {
    return palette.panelSubtle;
  }

  if (variant === 'inset') {
    return palette.panelInset;
  }

  return palette.panelRaised;
}

export function AppCanvas({
  children,
  className = 'flex-1',
  style,
  decorative = true,
}: CanvasProps) {
  const { isTablet, palette } = useAppTheme();

  return (
    <View className={className} style={[{ backgroundColor: palette.canvas }, style]}>
      {decorative ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.blob,
              {
                width: isTablet ? 320 : 240,
                height: isTablet ? 320 : 240,
                top: isTablet ? -84 : -72,
                left: isTablet ? -88 : -64,
                backgroundColor: palette.backdropPrimary,
              },
            ]}
          />
          <View
            style={[
              styles.blob,
              {
                width: isTablet ? 280 : 210,
                height: isTablet ? 280 : 210,
                top: isTablet ? -32 : -20,
                right: isTablet ? -60 : -40,
                backgroundColor: palette.backdropSecondary,
              },
            ]}
          />
          <View
            style={[
              styles.blob,
              {
                width: isTablet ? 340 : 260,
                height: isTablet ? 340 : 260,
                bottom: isTablet ? -180 : -140,
                left: '34%',
                backgroundColor: palette.backdropTertiary,
              },
            ]}
          />
          <View
            style={[
              styles.atmosphere,
              {
                top: isTablet ? 132 : 116,
                left: isTablet ? 48 : 28,
                backgroundColor: palette.atmospherePrimary,
              },
            ]}
          />
          <View
            style={[
              styles.atmosphere,
              {
                top: isTablet ? 196 : 188,
                right: isTablet ? 58 : 34,
                backgroundColor: palette.atmosphereSecondary,
              },
            ]}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function GlassPanel({
  children,
  className = '',
  style,
  variant = 'raised',
  highlight = null,
}: GlassPanelProps) {
  const { theme, palette } = useAppTheme();
  const shadowOpacity =
    variant === 'raised' ? (theme === 'dark' ? 0.26 : 0.12) : theme === 'dark' ? 0.18 : 0.08;

  return (
    <View
      className={`overflow-hidden rounded-[12px] border ${className}`.trim()}
      style={[
        {
          borderColor: highlight ? withAlpha(highlight, 0.22) : palette.border,
          backgroundColor: getPanelBackground(variant, palette),
          shadowColor: palette.shadow,
          shadowOpacity,
          shadowRadius: variant === 'raised' ? 18 : 12,
          shadowOffset: { width: 0, height: variant === 'raised' ? 12 : 8 },
          elevation: variant === 'raised' ? 10 : 5,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function IconBadge({
  icon,
  size = 46,
  iconSize = 20,
  color,
  backgroundColor,
  round = false,
}: {
  icon: AppIconName;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  round?: boolean;
}) {
  const { palette } = useAppTheme();
  const resolvedColor = color ?? palette.primary;
  const resolvedBackgroundColor = backgroundColor ?? palette.primarySoft;

  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : Math.max(8, size * 0.22),
        backgroundColor: resolvedBackgroundColor,
      }}>
      <AppIcon color={resolvedColor} name={icon} size={iconSize} />
    </View>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  const { palette, typography } = useAppTheme();

  return (
    <Text className={typography.caption} style={{ color: palette.primary }}>
      {children}
    </Text>
  );
}

export function MetricPill({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'accent' | 'cta';
}) {
  const { palette, typography } = useAppTheme();
  const toneColor = tone === 'accent' ? palette.accent : tone === 'cta' ? palette.cta : palette.textMuted;

  return (
    <View
      className="rounded-full border px-3.5 py-2"
      style={{
        borderColor: withAlpha(toneColor, 0.16),
        backgroundColor: tone === 'default' ? palette.panelInset : withAlpha(toneColor, 0.12),
      }}>
      <Text className={typography.caption} style={{ color: tone === 'default' ? palette.textMuted : toneColor }}>
        {label}
      </Text>
    </View>
  );
}

export function MetricCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  const { palette, typography } = useAppTheme();

  return (
    <GlassPanel className="min-w-[84px] px-3.5 py-3" variant="inset">
      <Text className={typography.h3} style={{ color: palette.text }}>
        {value}
      </Text>
      <Text className={typography.caption} style={{ color: palette.textSoft }}>
        {label}
      </Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  atmosphere: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 9999,
  },
});
