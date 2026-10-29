import { useMemo } from 'react';
import { loadFactor } from '@/domain/loading';
import type { LoadFactor } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';

/** How the totals count the weight, from the user's choice in Profil. */
export function useLoadFactor(): LoadFactor {
  const countBothSides = useSettingsStore((s) => s.settings.countBothSides);
  const customExercises = useSettingsStore((s) => s.settings.customExercises);
  const plateLoaded = useSettingsStore((s) => s.settings.plateLoaded);
  return useMemo(
    () => loadFactor({ countBothSides, customExercises, plateLoaded }),
    [countBothSides, customExercises, plateLoaded],
  );
}
