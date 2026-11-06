import { useMemo } from 'react';
import type { Gym } from '@/domain/plates';
import { useSettingsStore } from '@/stores/settingsStore';

/** The user's bar, plates and collars, for the plate computations. */
export function useGym(): Gym {
  const barWeight = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  const collarWeight = useSettingsStore((s) => s.settings.collarWeight);
  return useMemo(() => ({ barWeight, plates, collarWeight }), [barWeight, plates, collarWeight]);
}
