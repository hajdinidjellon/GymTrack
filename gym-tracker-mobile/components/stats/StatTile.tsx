import React from 'react';
import { View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

/** A number and what it counts. `accent` puts the number in brass. */
export function StatTile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 2,
      }}
    >
      <Text
        size={24}
        weight="black"
        color={accent ? colors.brass : colors.cream}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text size={13} weight="semibold" color={colors.muted} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
