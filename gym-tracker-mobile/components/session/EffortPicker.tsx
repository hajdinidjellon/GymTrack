import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { EFFORT_LABELS, EFFORTS, effortOf } from '@/domain/effort';
import { findSet } from '@/domain/session';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';

/** "Comment c'était ?" in the rest popup: one tap on the set just validated. The next targets listen to it. */
export function EffortPicker() {
  const rateLastSet = useSessionStore((s) => s.rateLastSet);
  const rated = useSessionStore((s) => {
    const last = s.activeSession?.lastCompleted;
    return last ? effortOf(findSet(s.activeSession!, last.exerciseId, last.setIndex)?.rpe) : undefined;
  });

  return (
    <View style={{ gap: 6 }}>
      <Text size={13} weight="semibold">
        Comment c&apos;était ?
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
                height: 44,
                borderRadius: radius.pill,
                borderWidth: selected ? border.strong : border.base,
                borderColor: colors.ink,
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
