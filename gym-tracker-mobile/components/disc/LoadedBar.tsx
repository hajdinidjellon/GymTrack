import React from 'react';
import { loadBar } from '@/lib/plates';
import { useSettingsStore } from '@/stores/settingsStore';
import { Barbell } from './Barbell';

/** A bar loaded for `weight` with the plates of the user's gym. */
export function LoadedBar({ weight, scale, barWidth }: { weight: number; scale?: number; barWidth?: number }) {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  return <Barbell perSide={loadBar(weight, bar, plates).perSide} scale={scale} barWidth={barWidth} />;
}

export function usePerSide(weight: number): number[] {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  return loadBar(weight, bar, plates).perSide;
}
