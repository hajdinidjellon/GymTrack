import React from 'react';
import { Pressable } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { Text } from './Text';
import { buzz } from './PressableScale';

/** A small round pill of a row of choices: the picked one coral. */
export function Pill({
  label,
  a11y,
  on,
  onPress,
  role = 'radio',
}: {
  label: string;
  a11y?: string;
  on: boolean;
  onPress: () => void;
  role?: 'radio' | 'button';
}) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onPress();
      }}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected: on } : undefined}
      accessibilityLabel={a11y ?? label}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        borderWidth: on ? border.strong : border.base,
        borderColor: colors.outline,
        backgroundColor: on || pressed ? colors.coralSoft : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text size={16} weight={on ? 'black' : 'titleMedium'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
