import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { alternativesFor, dayKey, findExerciseDef, choosableDays, type ExerciseDef } from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { CheckRow } from '@/components/ui/CheckRow';
import { ExercisePicker } from './ExercisePicker';
import { dayName, t } from '@/i18n';

/** "+" after the exercise pills: one more exercise, done last, computed like the others. */
export function AddExercise({ current, sessionName }: { current: ActiveExercise; sessionName: string }) {
  const ctx = useBuildContext();
  const exercises = useSessionStore((s) => s.activeSession?.exercises ?? []);
  const [open, setOpen] = useState(false);
  const [keep, setKeep] = useState(false);
  if (!ctx) return null;

  const own = ctx.settings.customExercises;
  const split = ctx.profile.program.split;
  const day = choosableDays(split, ctx.settings.customDays, own, ctx.settings.ownDays).find(
    (d) => d.name === sessionName,
  );
  const def = findExerciseDef(current.name, own);
  const taken = exercises.map((e) => e.name);

  const pick = (next: ExerciseDef) => {
    useSessionStore.getState().addExercise(toActiveExercise(planLift(next, ctx), exercises.length));
    if (keep && day) {
      const names = day.exercises.map((e) => e.name);
      if (!names.includes(next.name)) {
        useSettingsStore.getState().setDayExercises(dayKey(day.split, day.name), [...names, next.name]);
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
        accessibilityLabel={t('session.add.a11y')}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        {({ pressed }) => (
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              borderWidth: 2,
              borderColor: colors.outline,
              backgroundColor: pressed ? colors.coralSoft : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={24} weight="black" maxFontSizeMultiplier={1.2} style={{ lineHeight: 26 }}>
              +
            </Text>
          </View>
        )}
      </Pressable>
      <ExercisePicker
        visible={open}
        title={t('session.add.title')}
        taken={taken}
        suggested={def ? alternativesFor(def, own).filter((e) => !taken.includes(e.name)) : []}
        suggestedTitle={t('session.add.sameMuscle')}
        muscle={current.muscleGroups[0]}
        onPick={pick}
        onClose={() => setOpen(false)}
        options={
          day ? (
            <CheckRow label={t('session.add.keep', { day: dayName(day.name) })} checked={keep} onChange={setKeep} />
          ) : null
        }
      />
    </>
  );
}
