import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Weight = keyof typeof fonts;

interface Props extends TextProps {
  size?: number;
  weight?: Weight;
  color?: string;
  align?: TextStyle['textAlign'];
}

/** Big numbers and titles are tightened, like the mockups. */
function tracking(size: number) {
  if (size >= 40) return -size * 0.045;
  if (size >= 28) return -size * 0.03;
  return 0;
}

export function Text({ size = 17, weight = 'regular', color = colors.cream, align, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          letterSpacing: tracking(size),
          textAlign: align,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    />
  );
}
