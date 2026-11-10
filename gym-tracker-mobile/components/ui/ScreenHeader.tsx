import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { BackButton, type BackProps } from './BackButton';
import { Text } from './Text';

interface Props {
  /** Small line above the title: the date, the context. */
  eyebrow?: string;
  title: string;
  /** One sentence saying what this screen is for. */
  subtitle?: string;
  /** Next to the title, on the right. */
  right?: React.ReactNode;
  /** The round back arrow on the title's line: true for a plain "back", or its own label/action. */
  back?: boolean | BackProps;
}

/** Every screen starts the same way, so you always know where you are. */
export function ScreenHeader({ eyebrow, title, subtitle, right, back }: Props) {
  return (
    <View style={{ marginTop: space.sm, marginBottom: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        {back ? <BackButton {...(back === true ? {} : back)} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <Text size={14} weight="bold" color={colors.inkMuted} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            size={32}
            weight="black"
            accessibilityRole="header"
            numberOfLines={2}
            style={{ lineHeight: 38, marginTop: 2 }}
          >
            {title}
          </Text>
        </View>
        {right}
      </View>
      {subtitle ? (
        <Text size={15} color={colors.inkMuted} style={{ marginTop: space.xs, lineHeight: 21 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
