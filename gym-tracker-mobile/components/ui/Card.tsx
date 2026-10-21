import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ borderRadius: radius.lg, backgroundColor: colors.surface, paddingVertical: 16, paddingHorizontal: 20 }, style]}>
      {children}
    </View>
  );
}
