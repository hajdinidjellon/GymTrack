import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  /** Pinned at the bottom: the main action of the screen. */
  footer?: React.ReactNode;
  scroll?: boolean;
  /** Turned off while something is dragged inside the screen. */
  scrollEnabled?: boolean;
  /** Room for the tab bar. */
  tabs?: boolean;
  /** Drawn behind the content, over the paper: a decoration that must not hide under the background. */
  background?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, footer, scroll, scrollEnabled = true, tabs, style, background }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = tabs ? space.lg : Math.max(insets.bottom, space.lg) + space.sm;
  const content = [{ paddingTop: insets.top + space.md, paddingHorizontal: space.gutter }, style];

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {background ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {background}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={[content, { paddingBottom: space.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {scroll ? (
        // Scrolled content slides under a paper band instead of under the clock
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.paper }}
        />
      ) : null}
      {footer ? (
        <View style={{ paddingHorizontal: space.gutter, paddingBottom: bottom, gap: space.sm }}>{footer}</View>
      ) : null}
    </View>
  );
}
