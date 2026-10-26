import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

/** A surface one step closer than the page, with a hairline edge. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          paddingVertical: 16,
          paddingHorizontal: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
