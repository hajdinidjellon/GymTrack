/**
 * POWER ON — entrée d'écran « mise sous tension » (DESIGN-GYMTRACK.md §A.7).
 * Chaque carte arrive en cascade (stagger 50ms) : translateY 12→0 + fade.
 * Usage : envelopper chaque bloc de l'écran avec un index croissant.
 */
import React from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { motion } from '@/constants/theme';

export type PowerOnProps = {
  /** Position dans la cascade (0, 1, 2…). */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function PowerOn({ index = 0, style, children }: PowerOnProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.move)
        .delay(index * motion.stagger)
        .springify()
        .damping(motion.spring.damping)
        .stiffness(motion.spring.stiffness)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
