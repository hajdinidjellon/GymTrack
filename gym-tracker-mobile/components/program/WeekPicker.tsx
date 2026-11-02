import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, hardShadow } from '@/constants/theme';
import { sessionLetter, WEEKDAYS } from '@/domain/onboarding';
import { WEEKDAY_NAMES, type Schedule } from '@/domain/schedule';
import { dayName, t } from '@/i18n';
import { Text } from '@/components/ui/Text';

interface Props {
  week: Schedule;
  /** The program's sessions, in order: A, B, C. */
  names: string[];
  onChange: (week: Schedule) => void;
}

/**
 * The seven days in a row, one of them picked. Under them, the sessions of the
 * picked day as plain choices: tap a day, then its session. Nothing to guess.
 */
export function WeekPicker({ week, names, onChange }: Props) {
  // Le premier jour de séance est ouvert d'emblée : on voit tout de suite comment ça marche
  const [open, setOpen] = useState(() => Math.max(0, week.findIndex(Boolean)));
  const current = week[open] ?? null;
  const choose = (name: string | null) => onChange(week.map((n, i) => (i === open ? name : n)));

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {WEEKDAYS.map((d, i) => {
          const name = week[i] ?? null;
          const on = i === open;
          return (
            <Pressable
              key={d}
              onPress={() => setOpen(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t('onboarding.flow.rhythm.dayLabel', {
                weekday: WEEKDAY_NAMES[i]!,
                name: name ? dayName(name) : t('onboarding.flow.rhythm.rest'),
              })}
              hitSlop={4}
              style={({ pressed }) => ({ alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
            >
              <Text size={13} weight="bold" color={on ? colors.ink : colors.inkFaint}>
                {d}
              </Text>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  borderWidth: on ? border.strong : border.base,
                  borderColor: name || on ? colors.outlineStrong : colors.line,
                  borderStyle: name || on ? 'solid' : 'dashed',
                  backgroundColor: name ? colors.coralSoft : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(on ? hardShadow(2) : {}),
                }}
              >
                {name ? (
                  <Text size={15} weight="titleMedium">
                    {sessionLetter(name, names)}
                  </Text>
                ) : null}
              </View>
              {/* Le jour ouvert : un point sous son rond */}
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: on ? colors.coral : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10, paddingTop: 12, borderTopWidth: 2, borderTopColor: colors.line }}>
        <Text size={16} weight="titleMedium">
          {t('onboarding.flow.rhythm.sessionOf', { weekday: WEEKDAY_NAMES[open]! })}
        </Text>
        {/* Toutes les séances sur une ligne : chacune prend la même place */}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6 }}>
          {[null, ...names].map((name) => {
            const on = current === name;
            return (
              <Pressable
                key={name ?? 'rest'}
                onPress={() => choose(name)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={name ? dayName(name) : t('onboarding.flow.rhythm.restChoice')}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 42,
                  paddingHorizontal: 6,
                  borderRadius: 21,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  borderWidth: on ? border.strong : border.base,
                  borderColor: on ? colors.outlineStrong : colors.line,
                  borderStyle: name === null && !on ? 'dashed' : 'solid',
                  backgroundColor: on || pressed ? colors.coralSoft : 'transparent',
                  ...(on ? hardShadow(2) : {}),
                })}
              >
                {name ? (
                  <Text size={13} weight="titleMedium" color={on ? colors.ink : colors.inkFaint}>
                    {sessionLetter(name, names)}
                  </Text>
                ) : null}
                <Text
                  size={15}
                  weight="black"
                  color={on ? colors.ink : colors.inkMuted}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{ flexShrink: 1 }}
                >
                  {name ? dayName(name) : t('onboarding.flow.rhythm.restChoice')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
