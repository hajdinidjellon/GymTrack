import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { alternativesFor, dayKey, findExerciseDef, programDays, type ExerciseDef } from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { CheckRow } from '@/components/ui/CheckRow';
import { ExercisePicker } from './ExercisePicker';

/** "+" after the exercise pills: one more exercise, done last, computed like the others. */
export function AddExercise({ current, sessionName }: { current: ActiveExercise; sessionName: string }) {
  const ctx = useBuildContext();
  const exercises = useSessionStore((s) => s.activeSession?.exercises ?? []);
  const [open, setOpen] = useState(false);
  const [keep, setKeep] = useState(false);
  if (!ctx) return null;

  const own = ctx.settings.customExercises;
  const split = ctx.profile.program.split;
  const day = programDays(split, ctx.settings.customDays, own).find((d) => d.name === sessionName);
  const def = findExerciseDef(current.name, own);
  const taken = exercises.map((e) => e.name);

  const pick = (next: ExerciseDef) => {
    useSessionStore.getState().addExercise(toActiveExercise(planLift(next, ctx), exercises.length));
    if (keep && day) {
      const names = day.exercises.map((e) => e.name);
      if (!names.includes(next.name)) {
        useSettingsStore.getState().setDayExercises(dayKey(split, day.name), [...names, next.name]);
      }
    }
    setOpen(false);
    setKeep(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un exercice à la séance"
        hitSlop={8}
        style={({ pressed }) => ({
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: pressed ? 'solid' : 'dashed',
          borderColor: pressed ? colors.ink : colors.inkFaint,
          backgroundColor: pressed ? colors.coralSoft : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text size={16} weight="black" color={colors.inkMuted} style={{ lineHeight: 18 }}>
          +
        </Text>
      </Pressable>
      <ExercisePicker
        visible={open}
        title="Ajouter un exercice"
        taken={taken}
        suggested={def ? alternativesFor(def, own).filter((e) => !taken.includes(e.name)) : []}
        suggestedTitle="Même muscle"
        muscle={current.muscleGroups[0]}
        onPick={pick}
        onClose={() => setOpen(false)}
        footer={
          day ? (
            <CheckRow
              label={`L'ajouter aussi à mes prochaines séances ${day.name}`}
              checked={keep}
              onChange={setKeep}
            />
          ) : null
        }
      />
    </>
  );
}
