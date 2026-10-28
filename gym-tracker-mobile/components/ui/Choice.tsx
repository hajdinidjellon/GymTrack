import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { border, colors, hardShadow, radius } from '@/constants/theme';

interface Props {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A card you pick from a list. The selected one turns coral and stands out on its shadow. */
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
          borderCurve: 'continuous',
          backgroundColor: selected ? colors.coralSoft : colors.card,
          borderWidth: selected ? border.strong : border.base,
          borderColor: colors.ink,
          ...(pressed ? {} : hardShadow(selected ? 4 : 2)),
          transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
