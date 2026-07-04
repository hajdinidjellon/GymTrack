// =============================================================
// StatsCornerCard.tsx
// Non-rectangular HUD card with chamfered inner corner.
// Used in a 2×2 grid around a central RankCore (Halo-style).
//
// Props:
//   corner        - 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
//   value         - main number, e.g. "12" or "0.0 t"
//   label         - multi-line label, can include '\n'
//   icon          - any ReactNode (your own SVG icon)
//   width, height - optional, defaults to 170×88
//   accent        - hex cyan (default #00C8FF)
//   chamfer       - corner cut size in px (default 28)
//
// Visuals: double cyan stroke + soft inner glow + bright tick at
// each outer corner. Drawn entirely with react-native-svg.
// =============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, RadialGradient, Rect, G } from 'react-native-svg';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface StatsCornerCardProps {
  corner: Corner;
  value: string;
  label: string;
  icon?: React.ReactNode;
  width?: number;
  height?: number;
  accent?: string;
  chamfer?: number;
  valueColor?: string;
  labelColor?: string;
}

/** Polygon points (cw) for each corner variant. */
function buildPath(w: number, h: number, c: number, corner: Corner) {
  switch (corner) {
    case 'top-left':     // inner = bottom-right
      return `M 0 0 H ${w} V ${h - c} L ${w - c} ${h} H 0 Z`;
    case 'top-right':    // inner = bottom-left
      return `M 0 0 H ${w} V ${h} H ${c} L 0 ${h - c} Z`;
    case 'bottom-left':  // inner = top-right
      return `M 0 0 H ${w - c} L ${w} ${c} V ${h} H 0 Z`;
    case 'bottom-right': // inner = top-left
      return `M ${c} 0 H ${w} V ${h} H 0 V ${c} Z`;
  }
}

/** Inset version of buildPath — used to draw the inner double-border. */
function buildInsetPath(w: number, h: number, c: number, corner: Corner, inset: number) {
  const w2 = w - inset, h2 = h - inset, c2 = c - inset * 0.4;
  switch (corner) {
    case 'top-left':
      return `M ${inset} ${inset} H ${w2} V ${h2 - c2} L ${w2 - c2} ${h2} H ${inset} Z`;
    case 'top-right':
      return `M ${inset} ${inset} H ${w2} V ${h2} H ${c2 + inset} L ${inset} ${h2 - c2} Z`;
    case 'bottom-left':
      return `M ${inset} ${inset} H ${w2 - c2} L ${w2} ${c2 + inset} V ${h2} H ${inset} Z`;
    case 'bottom-right':
      return `M ${c2 + inset} ${inset} H ${w2} V ${h2} H ${inset} V ${c2 + inset} Z`;
  }
}

/** Outer corner accent ticks — bright cyan caps. */
function outerCornerAccents(w: number, h: number, c: number, corner: Corner, len: number): string[] {
  const t: string[] = [];
  // Outer corners differ per variant; chamfer is on inner. List the 3 outer corners.
  const corners = {
    'top-left':    [['tl', 0, 0], ['tr', w, 0], ['bl', 0, h]],
    'top-right':   [['tl', 0, 0], ['tr', w, 0], ['br', w, h]],
    'bottom-left': [['tl', 0, 0], ['bl', 0, h], ['br', w, h]],
    'bottom-right':[['tr', w, 0], ['bl', 0, h], ['br', w, h]],
  }[corner] as Array<[string, number, number]>;

  for (const [k, x, y] of corners) {
    if (k === 'tl') t.push(`M ${x} ${y + len} V ${y} H ${x + len}`);
    if (k === 'tr') t.push(`M ${x - len} ${y} H ${x} V ${y + len}`);
    if (k === 'bl') t.push(`M ${x} ${y - len} V ${y} H ${x + len}`);
    if (k === 'br') t.push(`M ${x - len} ${y} H ${x} V ${y - len}`);
  }
  return t;
}

export function StatsCornerCard({
  corner,
  value,
  label,
  icon,
  width = 170,
  height = 88,
  accent = '#00C8FF',
  chamfer = 28,
  valueColor = '#FFFFFF',
  labelColor = 'rgba(255,255,255,0.6)',
}: StatsCornerCardProps) {
  const w = width, h = height, c = chamfer;
  const path = buildPath(w, h, c, corner);
  const inner = buildInsetPath(w, h, c, corner, 5);
  const ticks = outerCornerAccents(w, h, c, corner, 11);

  // Content alignment — push content AWAY from the chamfered (inner) corner.
  const contentStyle = {
    'top-left':     { paddingTop: 12, paddingLeft: 14, paddingRight: 32, paddingBottom: 18 },
    'top-right':    { paddingTop: 12, paddingLeft: 32, paddingRight: 14, paddingBottom: 18 },
    'bottom-left':  { paddingTop: 18, paddingLeft: 14, paddingRight: 32, paddingBottom: 12 },
    'bottom-right': { paddingTop: 18, paddingLeft: 32, paddingRight: 14, paddingBottom: 12 },
  }[corner];

  const uid = React.useId();

  return (
    <View style={{ width: w, height: h, position: 'relative' }}>
      <Svg
        width={w}
        height={h}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A1A2F" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#02060E" stopOpacity="0.96" />
          </LinearGradient>
          <RadialGradient
            id={`glow-${uid}`}
            cx={corner.includes('right') ? '20%' : '80%'}
            cy={corner.includes('bottom') ? '20%' : '80%'}
            r="80%"
          >
            <Stop offset="0" stopColor={accent} stopOpacity="0.18" />
            <Stop offset="1" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* fill + subtle inner glow */}
        <Path d={path} fill={`url(#fill-${uid})`} />
        <Path d={path} fill={`url(#glow-${uid})`} />

        {/* outer border */}
        <Path d={path} fill="none" stroke={accent} strokeOpacity={0.95} strokeWidth={1.4} />

        {/* inner double-border */}
        <Path d={inner} fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={0.9} />

        {/* bright corner ticks */}
        <G>
          {ticks.map((d, i) => (
            <Path
              key={i}
              d={d}
              fill="none"
              stroke="#9EECFF"
              strokeOpacity={0.95}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          ))}
        </G>
      </Svg>

      <View style={[styles.contentRow, contentStyle]}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentRow: {
    position: 'absolute',
    inset: 0 as any, // RN web; RN ignores. Use top/left/right/bottom 0 fallback:
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '900', letterSpacing: -1, lineHeight: 28 },
  label: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 4, lineHeight: 12 },
});

export default StatsCornerCard;
