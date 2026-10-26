import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import type { ActiveExercise } from '@/types';

/** One segment per exercise, filled as its sets are validated. */
export function SessionProgress({ exercises }: { exercises: ActiveExercise[] }) {
  const done = exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
  const total = exercises.reduce((n, e) => n + e.sets.length, 0);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Avancement de la séance"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ flexDirection: 'row', gap: 4, height: 5 }}
    >
      {exercises.map((e) => {
        const ratio = e.sets.length ? e.sets.filter((s) => s.completed).length / e.sets.length : 0;
        return (
          <View key={e.id} style={{ flex: 1, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' }}>
            <View
              style={{
                width: `${ratio * 100}%`,
                height: '100%',
                backgroundColor: ratio === 1 ? colors.cream : colors.accent,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
