import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { border, colors } from '@/constants/theme';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';

interface Props {
  exercises: ActiveExercise[];
  current: number;
  /** A waiting pill was tapped: its machine just freed up. */
  onPick: (exerciseId: string) => void;
}

type PillState = 'finished' | 'current' | 'waiting';

/** Finished: green. Current: bigger, coral. Waiting: dashed, solid while pressed. */
function pillStyle(state: PillState, pressed: boolean): ViewStyle {
  const size = state === 'current' ? 34 : 28;
  const solid = state !== 'waiting' || pressed;
  return {
    width: size,
    height: size,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: {
      finished: colors.success,
      current: colors.coral,
      waiting: pressed ? colors.coralSoft : 'transparent',
    }[state],
    borderWidth: state === 'current' ? border.strong : 2,
    borderColor: solid ? colors.ink : colors.line,
    borderStyle: solid ? 'solid' : 'dashed',
  };
}

/**
 * One round pill per exercise: done in green, the current one circled in coral,
 * the rest dashed. A dashed pill is a button: tap it to do that exercise now.
 */
export function SessionProgress({ exercises, current, onPick }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {exercises.map((e, i) => {
        const finished = e.sets.length > 0 && e.sets.every((s) => s.completed);
        const now = i === current;
        const waiting = !finished && !now;
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
            <Pressable
              disabled={!waiting}
              onPress={() => onPick(e.id)}
              hitSlop={8}
              accessibilityRole={waiting ? 'button' : 'text'}
              accessibilityLabel={
                waiting ? `Faire ${e.name} maintenant` : `${e.name}, ${finished ? 'terminé' : 'en cours'}`
              }
              style={({ pressed }) => pillStyle(finished ? 'finished' : now ? 'current' : 'waiting', pressed)}
            >
              {finished ? (
                <Check size={15} />
              ) : (
                <Text size={now ? 15 : 13} weight="black" color={now ? colors.ink : colors.inkFaint}>
                  {i + 1}
                </Text>
              )}
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}
