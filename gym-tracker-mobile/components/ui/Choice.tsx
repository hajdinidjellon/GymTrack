import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface Props {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A card you pick from a list. The selected one gets a cream outline. */
export function Choice({ selected, onPress, accessibilityLabel, children, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 2.5,
          borderColor: selected ? colors.cream : colors.surface,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
