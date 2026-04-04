import { Text, View } from 'react-native';

import { useAppTheme, withAlpha } from '../../theme';
import { AppIcon, type AppIconName } from '../common/AppIcon';
import { MotionPressable } from '../common/AppMotion';

type CommunityActionPillSize = 'xs' | 'sm' | 'md';

export interface CommunityActionPillProps {
  icon: AppIconName;
  label: string;
  active?: boolean;
  activeIcon?: AppIconName;
  color: string;
  disabled?: boolean;
  size?: CommunityActionPillSize;
  onPress: () => void;
}

const SIZE_CLASS_NAME: Record<CommunityActionPillSize, string> = {
  xs: 'px-2.5 py-1.5',
  sm: 'px-3 py-2',
  md: 'px-4 py-2.5',
};

const ICON_SIZE: Record<CommunityActionPillSize, number> = {
  xs: 13,
  sm: 15,
  md: 16,
};

export function CommunityActionPill({
  icon,
  label,
  active = false,
  activeIcon,
  color,
  disabled = false,
  size = 'sm',
  onPress,
}: CommunityActionPillProps) {
  const { palette, typography } = useAppTheme();
  const iconName = active && activeIcon ? activeIcon : icon;
  const tintColor = active ? color : palette.textMuted;

  return (
    <MotionPressable
      accessibilityRole="button"
      className={`rounded-full border ${SIZE_CLASS_NAME[size]}`}
      disabled={disabled}
      pressedScale={disabled ? 1 : 0.96}
      onPress={onPress}
      style={{
        borderColor: active ? withAlpha(color, 0.28) : palette.border,
        backgroundColor: active ? withAlpha(color, 0.12) : palette.surfaceAlt,
        opacity: disabled ? 0.6 : 1,
      }}>
      <View className="flex-row items-center gap-1.5">
        <AppIcon color={tintColor} name={iconName} size={ICON_SIZE[size]} />
        <Text className={`${typography.bodySmall} font-medium`} style={{ color: tintColor }}>
          {label}
        </Text>
      </View>
    </MotionPressable>
  );
}
