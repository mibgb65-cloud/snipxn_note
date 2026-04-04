import type { ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  SlideInRight,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const PRESS_SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.55,
};

export const APP_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(18)
  .stiffness(200)
  .mass(0.8);

export const APP_CARD_ENTERING = FadeInDown.duration(260);
export const APP_CARD_EXITING = FadeOutDown.duration(180);
export const APP_FADE_IN = FadeIn.duration(180);
export const APP_FADE_OUT = FadeOut.duration(140);
export const APP_HEADER_ENTERING = FadeInDown.duration(220);
export const APP_HEADER_EXITING = FadeOut.duration(150);
export const APP_PANEL_ENTERING = SlideInRight.springify()
  .damping(20)
  .stiffness(220)
  .mass(0.9);
export const APP_PANEL_EXITING = SlideOutRight.duration(180);

export interface MotionPressableProps
  extends Omit<PressableProps, 'children' | 'style' | 'onPressIn' | 'onPressOut'> {
  children: ReactNode;
  className?: string;
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
}

export function MotionPressable({
  children,
  className,
  pressedScale = 0.975,
  style,
  onPressIn,
  onPressOut,
  ...props
}: MotionPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    scale.value = withSpring(pressedScale, PRESS_SPRING_CONFIG);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, PRESS_SPRING_CONFIG);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        className={className}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
