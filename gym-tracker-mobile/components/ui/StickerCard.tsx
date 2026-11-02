import React from 'react';
import { View, type ViewProps } from 'react-native';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';

type Props = ViewProps & {
  /** `hero` = coral card for the big moment of the screen, one per screen max. */
  tone?: 'default' | 'hero' | 'sun';
  /** Small cards inside lists: thinner outline, shorter shadow. */
  small?: boolean;
};

const backgrounds = {
  default: colors.card,
  hero: colors.coralSoft,
  sun: colors.sun,
};

export function StickerCard({ tone = 'default', small, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: backgrounds[tone],
          borderWidth: small ? border.base : border.strong,
          borderColor: colors.ink,
          borderRadius: small ? radius.row : radius.card,
          borderCurve: 'continuous',
          paddingVertical: small ? space.md : space.lg + 2,
          paddingHorizontal: small ? space.lg : space.lg + 2,
          ...hardShadow(small ? 2 : 5),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
