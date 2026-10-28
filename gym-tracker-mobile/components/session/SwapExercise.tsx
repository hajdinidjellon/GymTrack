import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import {
  alternativesFor,
  dayKey,
  findExerciseDef,
  MUSCLE_LABELS,
  programDays,
  type ExerciseDef,
} from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';
import { buzz } from '@/components/ui/PressableScale';
import { ExercisePicker } from './ExercisePicker';

/** "Changer" next to the exercise name: machine taken, sore shoulder… another exercise, computed the same way. */
export function SwapExercise({ exercise, sessionName }: { exercise: ActiveExercise; sessionName: string }) {
  const ctx = useBuildContext();
  const exercises = useSessionStore((s) => s.activeSession?.exercises ?? []);
  const [open, setOpen] = useState(false);
  const [keep, setKeep] = useState(false);
  if (!ctx) return null;

  const own = ctx.settings.customExercises;
  const def = findExerciseDef(exercise.name, own);
  const split = ctx.profile.program.split;
  const day = programDays(split, ctx.settings.customDays, own).find((d) => d.name === sessionName);
  const muscle = exercise.muscleGroups[0];

  const pick = (next: ExerciseDef) => {
    const active = toActiveExercise(planLift(next, ctx), exercises.length);
    useSessionStore.getState().replaceExercise(exercise.id, active);
    if (keep && day) {
      // Déjà plus loin dans la séance : il prend juste la place de l'ancien
      const names = day.exercises.map((e) => e.name).filter((n) => n !== next.name);
      const at = names.indexOf(exercise.name);
      if (at >= 0) names.splice(at, 1, next.name);
      else names.push(next.name);
      useSettingsStore.getState().setDayExercises(dayKey(split, day.name), names);
    }
    setOpen(false);
    setKeep(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Changer d'exercice, à la place de ${exercise.name}`}
        hitSlop={8}
        style={({ pressed }) => ({
          height: 36,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          borderWidth: border.base,
          borderColor: colors.ink,
          backgroundColor: pressed ? colors.coralSoft : colors.card,
          justifyContent: 'center',
        })}
      >
        <Text size={14} weight="titleMedium">
          Changer
        </Text>
      </Pressable>
      <ExercisePicker
        visible={open}
        title="Changer d'exercice"
        taken={exercises.map((e) => e.name)}
        suggested={def ? alternativesFor(def, own) : []}
        suggestedTitle={muscle ? `Même muscle · ${MUSCLE_LABELS[muscle]}` : 'Suggestions'}
        muscle={muscle}
        onPick={pick}
        onClose={() => setOpen(false)}
        footer={
          day ? (
            <Pressable
              onPress={() => {
                buzz('selection');
                setKeep(!keep);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: keep }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  borderWidth: border.base,
                  borderColor: colors.ink,
                  backgroundColor: keep ? colors.success : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {keep ? <Check size={16} /> : null}
              </View>
              <Text size={15} weight="bold" style={{ flex: 1 }}>
                Garder ce changement pour mes prochaines séances {day.name}
              </Text>
            </Pressable>
          ) : null
        }
      />
    </>
  );
}
