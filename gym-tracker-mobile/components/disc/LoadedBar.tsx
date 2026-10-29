import React from 'react';
import { sidePlates, type Loading } from '@/domain/loading';
import { loadBar } from '@/domain/plates';
import { useSettingsStore } from '@/stores/settingsStore';
import { Barbell } from './Barbell';

/** A bar loaded for `weight` with the plates of the user's gym. */
export function LoadedBar({ weight, scale, barWidth }: { weight: number; scale?: number; barWidth?: number }) {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  return <Barbell perSide={loadBar(weight, bar, plates).perSide} scale={scale} barWidth={barWidth} />;
}

export function usePerSide(weight: number): number[] {
  return useSidePlates('bar', weight);
}

/** Plates for one side with the user's gym: on the bar, or on a plate-loaded machine. */
export function useSidePlates(loading: Loading, weight: number): number[] {
  const barWeight = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  return sidePlates(loading, weight, { barWeight, plates });
}
