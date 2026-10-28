import React from 'react';
import { View } from 'react-native';
import { border, colors, plateColor } from '@/constants/theme';
import type { WeekDay } from '@/domain/stats';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';

const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Monday to Sunday. A trained day is a blue 20 kg plate, today is circled in coral, days ahead are dashed. */
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
          <Text size={13} weight="bold" color={d.today ? colors.ink : colors.inkFaint}>
            {d.letter}
          </Text>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.done ? plateColor(20) : d.today ? colors.coralSoft : 'transparent',
              borderWidth: d.today ? border.strong : d.done ? border.base : 2,
              borderColor: d.done || d.today ? colors.ink : colors.line,
              borderStyle: d.done || d.today ? 'solid' : 'dashed',
            }}
          >
            {d.done ? (
              <Check size={18} color={colors.card} />
            ) : (
              <Text size={13} weight="bold" color={d.today ? colors.ink : colors.inkFaint}>
                {d.date.getDate()}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
