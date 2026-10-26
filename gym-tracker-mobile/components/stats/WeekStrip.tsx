import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import type { WeekDay } from '@/domain/stats';
import { Text } from '@/components/ui/Text';

const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Monday to Sunday. A trained day is a blue 20 kg plate, today is outlined in the accent colour. */
export function WeekStrip({ days }: { days: WeekDay[] }) {
  const done = days.filter((d) => d.done).map((d) => DAY_NAMES[days.indexOf(d)]);
  return (
    <View
      accessible
      accessibilityLabel={done.length ? `Entraîné ${done.join(', ')}` : 'Pas encore de séance cette semaine'}
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
    >
      {days.map((d, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 6 }}>
          <Text size={12} weight="bold" color={d.today ? colors.accent : colors.faint}>
            {d.letter}
          </Text>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.done ? colors.done : d.future ? 'transparent' : colors.surfaceHigh,
              borderWidth: d.today ? 2 : d.future ? 1.5 : 0,
              borderColor: d.today ? colors.accent : colors.line,
              borderStyle: d.future && !d.today ? 'dashed' : 'solid',
            }}
          >
            {d.done ? (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg }} />
            ) : (
              <Text size={13} weight="bold" color={d.today ? colors.cream : colors.faint}>
                {d.date.getDate()}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
