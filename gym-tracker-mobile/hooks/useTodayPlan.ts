import { useMemo } from 'react';
import { nextDay, planDay, type BuildContext, type PlannedDay } from '@/lib/sessionBuilder';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';

export function useBuildContext(): BuildContext | null {
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const workouts = useWorkoutStore((s) => s.workouts);
  return useMemo(() => (profile ? { profile, settings, workouts } : null), [profile, settings, workouts]);
}

/** Today's session, fully computed from the history. */
export function useTodayPlan(): PlannedDay | null {
  const ctx = useBuildContext();
  return useMemo(() => (ctx ? planDay(nextDay(ctx), ctx) : null), [ctx]);
}
