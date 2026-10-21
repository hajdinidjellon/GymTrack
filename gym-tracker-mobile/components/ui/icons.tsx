import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function ChevronLeft({ size = 28, color = colors.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function ChevronRight({ size = 28, color = colors.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function Check({ size = 36, color = colors.bg }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

/** A loaded bar: today's session. */
export function BarIcon({ size = 22, color = colors.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={1} y={11} width={22} height={2} rx={1} />
      <Rect x={4} y={6} width={3} height={12} rx={1} />
      <Rect x={7.5} y={8} width={2} height={8} rx={1} />
      <Rect x={17} y={6} width={3} height={12} rx={1} />
      <Rect x={14.5} y={8} width={2} height={8} rx={1} />
    </Svg>
  );
}

/** Plates getting bigger: progress. */
export function ProgressIcon({ size = 22, color = colors.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={3} y={13} width={4} height={8} rx={1.5} />
      <Rect x={10} y={8} width={4} height={13} rx={1.5} />
      <Rect x={17} y={3} width={4} height={18} rx={1.5} />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = colors.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={12} cy={7.5} r={4.5} />
      <Path d="M3.5 21c0-4.4 3.8-7.5 8.5-7.5s8.5 3.1 8.5 7.5c0 .6-.4 1-1 1h-15c-.6 0-1-.4-1-1z" />
    </Svg>
  );
}
