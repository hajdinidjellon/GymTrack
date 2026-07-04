import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type StatIconName = 'streak' | 'week' | 'total' | 'volume';

interface StatIconProps {
  name: StatIconName;
  size?: number;
  color?: string;
}

export function StatIcon({ name, size = 22, color = '#fff' }: StatIconProps) {
  switch (name) {

    // ─── Flame / streak ─────────────────────────────────────────────────────────
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Main flame — flat color fill */}
          <Path
            d="M12 2.5c.3 2.5 1.6 4.1 3.2 5.6 1.9 1.8 3.3 3.7 3.3 6.4a6.5 6.5 0 1 1-13 0c0-1.7.6-3.1 1.8-4.5.7 1 1.7 1.5 2.6 1.5C9 8.4 8 5.5 12 2.5Z"
            fill={color}
          />
          {/* Inner hot core — white glow */}
          <Path
            d="M12 13c.1 1 .8 1.7 1.6 2.5.9.9 1.5 1.7 1.5 2.9a3 3 0 1 1-6 0c0-.8.3-1.5.9-2.1.3.5.8.7 1.2.7-.1-1.2.4-2.4.8-4Z"
            fill="#fff"
            opacity={0.45}
          />
        </Svg>
      );

    // ─── Calendar / week ────────────────────────────────────────────────────────
    case 'week':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Card body tint */}
          <Rect x="3" y="4" width="18" height="16.5" rx="3.2" fill={color} fillOpacity={0.12} />
          {/* Header filled area */}
          <Path
            d="M6.2 4 L17.8 4 A3.2 3.2 0 0 1 21 7.2 L21 9.5 L3 9.5 L3 7.2 A3.2 3.2 0 0 1 6.2 4 Z"
            fill={color}
            opacity={0.7}
          />
          {/* Card border */}
          <Rect x="3" y="4" width="18" height="16.5" rx="3.2" stroke={color} strokeWidth="1.6" />
          {/* Calendar pins */}
          <Path d="M8 2v3.5M16 2v3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          {/* Checkmark — white for contrast */}
          <Path
            d="m8.5 15.2 2.1 2.1 4.4-4.5"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // ─── Barbell / total ────────────────────────────────────────────────────────
    case 'total':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Left end-cap */}
          <Rect x="2"    y="9.5"  width="3" height="5"   rx="1.2" fill={color} />
          {/* Right end-cap */}
          <Rect x="19"   y="9.5"  width="3" height="5"   rx="1.2" fill={color} />
          {/* Left plate */}
          <Rect x="5.5"  y="7"    width="3" height="10"  rx="1.2" fill={color} />
          {/* Right plate */}
          <Rect x="15.5" y="7"    width="3" height="10"  rx="1.2" fill={color} />
          {/* Center bar */}
          <Rect x="8.5"  y="10.8" width="7" height="2.4" rx="0.8" fill={color} opacity={0.85} />
          {/* Top shine on bar */}
          <Rect x="8.5"  y="10.8" width="7" height="0.9" rx="0.5" fill="#fff"  opacity={0.35} />
        </Svg>
      );

    // ─── Trending up / volume ───────────────────────────────────────────────────
    case 'volume':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Area under curve */}
          <Path
            d="M3 17.5 8.5 12l3.5 3.5L20 7v14H3Z"
            fill={color}
            fillOpacity={0.18}
          />
          {/* Trend line */}
          <Path
            d="M3 17.5 8.5 12l3.5 3.5L20 7"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Arrow head */}
          <Path
            d="M14.5 7H20v5.5"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
}
