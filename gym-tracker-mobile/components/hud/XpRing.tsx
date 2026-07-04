// =============================================================
// XpRing.tsx
// Segmented circular progress ring (Halo / Apex sci-fi HUD).
// 24 rectangular blocks arranged radially.
// Active segments use a bright cyan gradient; inactive ones are dim.
// Smooth animation between progress values via Reanimated.
//
// Props:
//   progress       0-100, controls how many segments are bright
//   size           total svg size (default 140)
//   segments       number of bars around the ring (default 24)
//   thickness      bar height in px (radial direction) (default 14)
//   barWidth       bar width in px (default 5)
//   inset          gap between bar and outer edge (default 4)
//   activeColor    bright color (default '#00C8FF')
//   inactiveColor  dim color
//   duration       animation ms (default 900)
//   animated       turn off for instant updates
// =============================================================

import React from 'react';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, useDerivedValue, Easing,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { G, Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface XpRingProps {
  progress: number;
  size?: number;
  segments?: number;
  thickness?: number;
  barWidth?: number;
  inset?: number;
  activeColor?: string;
  inactiveColor?: string;
  duration?: number;
  animated?: boolean;
}

export function XpRing({
  progress,
  size = 140,
  segments = 24,
  thickness = 14,
  barWidth = 5,
  inset = 4,
  activeColor = '#00C8FF',
  inactiveColor = 'rgba(0,200,255,0.18)',
  duration = 900,
  animated = true,
}: XpRingProps) {
  const anim = useSharedValue(0);

  React.useEffect(() => {
    const target = Math.max(0, Math.min(100, progress));
    if (animated) {
      anim.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
    } else {
      anim.value = target;
    }
  }, [progress, animated, duration, anim]);

  const cx = size / 2;
  const cy = size / 2;
  const ringRadius = size / 2 - inset - thickness / 2;

  return (
    <Svg width={size} height={size} style={{ overflow: 'visible' }}>
      <Defs>
        <LinearGradient id="xpringActive" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B6F1FF" />
          <Stop offset="1" stopColor={activeColor} />
        </LinearGradient>
      </Defs>

      {/* faint outer + inner guide circles */}
      <Circle
        cx={cx} cy={cy}
        r={size / 2 - 2}
        stroke={activeColor}
        strokeOpacity={0.18}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={cx} cy={cy}
        r={ringRadius - thickness / 2 - 3}
        stroke={activeColor}
        strokeOpacity={0.3}
        strokeWidth={1}
        fill="none"
      />

      <G transform={`translate(${cx} ${cy})`}>
        {Array.from({ length: segments }, (_, i) => (
          <Segment
            key={i}
            index={i}
            total={segments}
            anim={anim}
            ringRadius={ringRadius}
            thickness={thickness}
            barWidth={barWidth}
            activeFill="url(#xpringActive)"
            inactiveFill={inactiveColor}
          />
        ))}
      </G>
    </Svg>
  );
}

/**
 * One segment = a static dim bar + an animated bright bar on top.
 * Opacity of the bright bar drives the activation.
 * We use Reanimated `useAnimatedProps` so each segment fades in
 * exactly when the animated progress crosses its threshold.
 */
function Segment({
  index, total, anim, ringRadius, thickness, barWidth, activeFill, inactiveFill,
}: {
  index: number;
  total: number;
  anim: SharedValue<number>;
  ringRadius: number;
  thickness: number;
  barWidth: number;
  activeFill: string;
  inactiveFill: string;
}) {
  const angle = (index / total) * 360;
  const threshold = ((index + 1) / total) * 100;

  // small ramp around the threshold so segments fade in smoothly
  const opacity = useDerivedValue(() => {
    const v = anim.value;
    const lo = threshold - (100 / total) * 0.6;
    const hi = threshold;
    if (v >= hi) return 1;
    if (v <= lo) return 0;
    return (v - lo) / (hi - lo);
  });

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
  }));

  const x = -barWidth / 2;
  const y = -ringRadius - thickness / 2;

  return (
    <G transform={`rotate(${angle})`}>
      {/* dim base */}
      <Rect
        x={x} y={y}
        width={barWidth} height={thickness}
        rx={1.2}
        fill={inactiveFill}
      />
      {/* bright overlay (animated opacity) */}
      <AnimatedRect
        x={x} y={y}
        width={barWidth} height={thickness}
        rx={1.2}
        fill={activeFill}
        // @ts-ignore — Reanimated animatedProps typing
        animatedProps={animatedProps}
      />
    </G>
  );
}

export default XpRing;
