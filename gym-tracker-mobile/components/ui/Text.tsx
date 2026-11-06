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

/**
 * How far the phone's text size can grow a text. Reading text grows the most;
 * titles and the big numbers are already large, they grow a little so they
 * still fit a small screen (iPhone SE) at the largest sizes.
 */
export function maxScaleFor(size: number): number {
  if (size >= 28) return 1.2;
  if (size >= 20) return 1.35;
  return 1.7;
}

export function Text({ size = 17, weight = 'regular', color = colors.ink, align, style, ...rest }: Props) {
  return (
    <RNText
      maxFontSizeMultiplier={maxScaleFor(size)}
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
