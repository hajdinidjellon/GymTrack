import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import type { ChoosableDay } from '@/domain/programs';
import { dayName, t } from '@/i18n';
import { Text } from '@/components/ui/Text';
import { buzz } from '@/components/ui/PressableScale';

/** "Pas envie de ça ?": every day of the program side by side, one tap to do it today instead. */
export function DayPicker({
  days,
  current,
  today,
  label = t('home.picker.label'),
  onChoose,
}: {
  days: ChoosableDay[];
  current: string | null;
  today: string | null;
  label?: string;
  onChoose: (name: string) => void;
}) {
  const program = days.filter((d) => !d.extra);
  const extras = days.filter((d) => d.extra);
  // The other programs' days wait behind one link, unless one is already picked
  const [showExtras, setShowExtras] = useState(false);
  const extrasOpen = showExtras || extras.some((d) => d.name === current);
  return (
    <View style={{ marginBottom: space.md }}>
      <Text size={14} weight="bold" color={colors.inkMuted}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {program.map((d) => {
          const on = d.name === current;
          const planned = d.name === today;
          return (
            <Pressable
              key={d.name}
              onPress={() => {
                buzz('selection');
                onChoose(d.name);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(planned ? 'home.picker.a11yPlanned' : 'home.picker.a11y', {
                name: dayName(d.name),
              })}
              style={{
                // Equal widths on one row; a long program wraps onto a second one
                flexGrow: 1,
                flexBasis: program.length > 3 ? '45%' : 0,
                minHeight: 56,
                paddingHorizontal: 10,
                borderRadius: radius.row,
                borderWidth: on ? border.strong : border.base,
                borderColor: on ? colors.outlineStrong : colors.outlineSoft,
                backgroundColor: on ? colors.coralSoft : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                ...(on ? hardShadow(2) : {}),
              }}
            >
              <Text size={16} weight="black" numberOfLines={1} color={on ? colors.ink : colors.inkMuted}>
                {dayName(d.name)}
              </Text>
              {planned ? (
                <Text size={12} weight="bold" color={colors.inkMuted}>
                  {t('home.picker.planned')}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {extras.length && !extrasOpen ? (
        <Pressable
          onPress={() => setShowExtras(true)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        >
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            {t('home.picker.extraLink')}
          </Text>
        </Pressable>
      ) : null}
      {extras.length && extrasOpen ? (
        <>
          <Text size={13} weight="bold" color={colors.inkMuted} style={{ marginTop: space.md }}>
            {t('home.picker.extraLabel')}
          </Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {extras.map((d) => {
              const on = d.name === current;
              return (
                <Pressable
                  key={d.name}
                  onPress={() => {
                    buzz('selection');
                    onChoose(d.name);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={
                    d.ownSession ? t('home.picker.a11yOwn') : t('home.picker.a11yExtra', { name: dayName(d.name) })
                  }
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 16,
                    borderRadius: radius.pill,
                    borderWidth: on ? border.strong : border.base,
                    // Hors programme : en pointillés tant qu'on ne l'a pas choisie
                    borderStyle: on ? 'solid' : 'dashed',
                    borderColor: on ? colors.outlineStrong : colors.outlineSoft,
                    backgroundColor: on ? colors.coralSoft : 'transparent',
                    justifyContent: 'center',
                    ...(on ? hardShadow(2) : {}),
                  }}
                >
                  <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                    {dayName(d.name)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}
