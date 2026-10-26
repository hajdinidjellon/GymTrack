import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/theme';

/** Little 4-point star. Decoration only: 2 max per screen, on a hero card or a celebration. */
export function Sparkle({ size = 28, fill = colors.sun }: { size?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityElementsHidden importantForAccessibility="no">
      <Path
        d="M20 4 L24 15 L35 20 L24 25 L20 36 L16 25 L5 20 L16 15 Z"
        fill={fill}
        stroke={colors.ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
