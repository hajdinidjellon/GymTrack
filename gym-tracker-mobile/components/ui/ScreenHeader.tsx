import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { Text } from './Text';

interface Props {
  /** Small line above the title: the date, the context. */
  eyebrow?: string;
  title: string;
  /** One sentence saying what this screen is for. */
  subtitle?: string;
  /** Next to the title, e.g. a back button above it is handled by the screen. */
  right?: React.ReactNode;
}

/** Every screen starts the same way, so you always know where you are. */
export function ScreenHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={{ marginTop: space.sm, marginBottom: space.lg }}>
      {eyebrow ? (
        <Text size={15} weight="semibold" color={colors.muted}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <Text
          size={40}
          weight="black"
          accessibilityRole="header"
          numberOfLines={2}
          style={{ flex: 1, lineHeight: 44, marginTop: 2 }}
        >
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? (
        <Text size={17} color={colors.muted} style={{ marginTop: space.xs, lineHeight: 23 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
