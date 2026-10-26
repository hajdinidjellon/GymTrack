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

/** Only the very big numbers are tightened a little. */
function tracking(size: number) {
  return size >= 40 ? -size * 0.02 : 0;
}

export function Text({ size = 17, weight = 'regular', color = colors.ink, align, style, ...rest }: Props) {
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
