import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import {
  alternativesFor,
  dayKey,
  findExerciseDef,
  MUSCLE_LABELS,
  choosableDays,
  type ExerciseDef,
} from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { CheckRow } from '@/components/ui/CheckRow';
import { ExercisePicker } from './ExercisePicker';
import { dayName, exerciseName, t } from '@/i18n';

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
  const day = choosableDays(split, ctx.settings.customDays, own).find((d) => d.name === sessionName);
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
      useSettingsStore.getState().setDayExercises(dayKey(day.split, day.name), names);
    }
    setOpen(false);
    setKeep(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('session.swap.a11y', { name: exerciseName(exercise.name) })}
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
          {t('session.swap.button')}
        </Text>
      </Pressable>
      <ExercisePicker
        visible={open}
        title={t('session.swap.title')}
        taken={exercises.map((e) => e.name)}
        suggested={def ? alternativesFor(def, own) : []}
        suggestedTitle={
          muscle ? t('session.swap.sameMuscle', { muscle: MUSCLE_LABELS[muscle] }) : t('session.picker.suggestions')
        }
        muscle={muscle}
        onPick={pick}
        onClose={() => setOpen(false)}
        footer={
          day ? (
            <CheckRow label={t('session.swap.keep', { day: dayName(day.name) })} checked={keep} onChange={setKeep} />
          ) : null
        }
      />
    </>
  );
}
