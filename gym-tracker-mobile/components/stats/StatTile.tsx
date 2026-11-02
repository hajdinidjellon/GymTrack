import React from 'react';
import { View } from 'react-native';
import { border, colors, hardShadow, radius } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

/** A number and what it counts. `highlight` puts it on a sun badge: records, gains. */
export function StatTile({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: radius.row,
        borderCurve: 'continuous',
        backgroundColor: highlight ? colors.sunPanel : colors.card,
        borderWidth: border.base,
        borderColor: colors.frame,
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 2,
        ...hardShadow(2),
      }}
    >
      <Text
        size={24}
        weight="black"
        color={highlight ? colors.onSunPanel : colors.ink}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text size={13} weight="semibold" color={highlight ? colors.ink : colors.inkMuted} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
