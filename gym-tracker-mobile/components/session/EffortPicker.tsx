import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { EFFORT_LABELS, EFFORTS, effortOf, RPE_STEPS } from '@/domain/effort';
import { formatKg } from '@/domain/plates';
import { findSet } from '@/domain/session';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

/**
 * "Comment c'était ?" in the rest popup: one tap on the set just validated. The next targets listen to it.
 * With "RPE précis" on, the same place offers RPE 6 to 10 by half points.
 */
export function EffortPicker() {
  const precise = useSettingsStore((s) => s.settings.preciseRpe);
  const rateLastSet = useSessionStore((s) => s.rateLastSet);
  const rateLastSetRpe = useSessionStore((s) => s.rateLastSetRpe);
  const rpe = useSessionStore((s) => {
    const last = s.activeSession?.lastCompleted;
    return last ? findSet(s.activeSession!, last.exerciseId, last.setIndex)?.rpe : undefined;
  });
  const rated = effortOf(rpe);

  if (precise) {
    return (
      <View style={{ gap: 6 }}>
        <Text size={13} weight="semibold">
          {t('session.effort.rpeQuestion')}
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 4 }}>
          {RPE_STEPS.map((value) => {
            const selected = rpe === value;
            return (
              <Pressable
                key={value}
                onPress={() => rateLastSetRpe(value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={t('session.effort.rpe', { rpe: formatKg(value) })}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 44,
                  borderRadius: radius.sm,
                  borderWidth: selected ? border.strong : border.base,
                  borderColor: colors.outline,
                  backgroundColor: selected || pressed ? colors.coralSoft : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text size={value % 1 ? 11 : 14} weight="titleMedium">
                  {formatKg(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Text size={13} weight="semibold">
        {t('session.effort.question')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
        {EFFORTS.map((effort) => {
          const selected = rated === effort;
          return (
            <Pressable
              key={effort}
              onPress={() => rateLastSet(effort)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 44,
                borderRadius: radius.pill,
                borderWidth: selected ? border.strong : border.base,
                borderColor: colors.outline,
                backgroundColor: selected || pressed ? colors.coralSoft : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text size={14} weight="titleMedium">
                {EFFORT_LABELS[effort]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
