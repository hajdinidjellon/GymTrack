import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '@/constants/theme';

export type HapticKind = 'selection' | 'light' | 'medium';

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 0.97 for cards, 0.96 for buttons. */
  scaleTo?: number;
  haptic?: HapticKind;
  children: React.ReactNode;
}

export function buzz(kind: HapticKind) {
  const run =
    kind === 'selection'
      ? Haptics.selectionAsync()
      : Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => null);
}

/** Everything you can tap sinks a little under the finger and springs back. */
export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, springs.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) buzz(haptic);
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
