import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  /** Pinned at the bottom: the main action of the screen. */
  footer?: React.ReactNode;
  scroll?: boolean;
  /** Room for the tab bar. */
  tabs?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, footer, scroll, tabs, style }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = tabs ? space.lg : Math.max(insets.bottom, space.lg) + space.sm;
  const content = [{ paddingTop: insets.top + space.md, paddingHorizontal: space.gutter }, style];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[content, { paddingBottom: space.xl }]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: space.gutter, paddingBottom: bottom, gap: space.sm }}>{footer}</View>
      ) : null}
    </View>
  );
}
