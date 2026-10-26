import React from 'react';
import { View } from 'react-native';
import { border, colors } from '@/constants/theme';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';

/** One round pill per exercise: done in green, the current one circled in coral, the rest dashed. */
export function SessionProgress({ exercises, current }: { exercises: ActiveExercise[]; current: number }) {
  const done = exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
  const total = exercises.reduce((n, e) => n + e.sets.length, 0);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Exercice ${current + 1} sur ${exercises.length}`}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      {exercises.map((e, i) => {
        const finished = e.sets.length > 0 && e.sets.every((s) => s.completed);
        const now = i === current;
        return (
          <React.Fragment key={e.id}>
            {i > 0 ? (
              <View
                style={{
                  flex: 1,
                  height: 2.5,
                  borderRadius: 2,
                  backgroundColor: finished || now ? colors.ink : colors.line,
                }}
              />
            ) : null}
            <View
              style={{
                width: now ? 34 : 28,
                height: now ? 34 : 28,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: finished ? colors.success : now ? colors.coral : 'transparent',
                borderWidth: now ? border.strong : 2,
                borderColor: finished || now ? colors.ink : colors.line,
                borderStyle: finished || now ? 'solid' : 'dashed',
              }}
            >
              {finished ? (
                <Check size={15} />
              ) : (
                <Text size={now ? 15 : 13} weight="black" color={now ? colors.ink : colors.inkFaint}>
                  {i + 1}
                </Text>
              )}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
