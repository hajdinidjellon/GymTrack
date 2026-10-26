import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Enters from 16 px below, once, when the screen first mounts. `index` sets
 * the cascade: 60 ms per step, capped so the last block is never late.
 */
export function FadeIn({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380)
        .delay(Math.min(index, 6) * 60)
        .springify()
        .damping(16)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
