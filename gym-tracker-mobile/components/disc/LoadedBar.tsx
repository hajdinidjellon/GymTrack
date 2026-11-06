import React from 'react';
import { sidePlates, type Loading } from '@/domain/loading';
import { useGym } from '@/hooks/useGym';
import { Barbell } from './Barbell';

/** A bar loaded for `weight` with the plates of the user's gym (and its collars). */
export function LoadedBar({ weight, scale, barWidth }: { weight: number; scale?: number; barWidth?: number }) {
  return <Barbell perSide={useSidePlates('bar', weight)} scale={scale} barWidth={barWidth} />;
}

export function usePerSide(weight: number): number[] {
  return useSidePlates('bar', weight);
}

/** Plates for one side with the user's gym: on the bar, or on a plate-loaded machine. */
export function useSidePlates(loading: Loading, weight: number): number[] {
  return sidePlates(loading, weight, useGym());
}
