/**
 * PROGRESS RAIL — barre de progression biseautée 8px.
 * Remplissage en dégradé + tête lumineuse, ticks de graduation tous
 * les 25 % (mode continu) ou segments discrets (mode `segments`,
 * utilisé par l'onboarding : 1 segment = 1 étape).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  Group,
  Rect as SkRect,
  Circle as SkCircle,
  BlurMask,
  LinearGradient as SkLinearGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { hud } from '@/constants/theme';
import { octagonPath, octagonSVG } from './octagon';
import { Skia } from '@shopify/react-native-skia';

export type ProgressRailProps = {
  /** 0 → 1 */
  progress: number;
  height?: number;
  /** Mode segmenté : nombre total de segments (progress = remplis/total). */
  segments?: number;
  color?: string;
  colorEnd?: string;
  /** Ticks de graduation tous les 25 % (mode continu). */
  ticks?: boolean;
};

export function ProgressRail({
  progress,
  height = 8,
  segments,
  color = hud.cyan.primary,
  colorEnd = hud.cyan.bright,
  ticks = true,
}: ProgressRailProps) {
  const [w, setW] = useState(0);
  const cut = Math.min(hud.cut.sm, height / 2);

  const railPath = useMemo(
    () => (w > 0 ? octagonPath(0.5, 0.5, w - 1, height - 1, cut) : null),
    [w, height, cut],
  );

  // ── Remplissage animé (spring doux via timing ease-out) ──────────
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const fillWidth = useDerivedValue(() => p.value * w);
  const headX = useDerivedValue(() => Math.max(cut, p.value * w - 1));

  // ── Mode segmenté ─────────────────────────────────────────────────
  if (segments && segments > 1) {
    const filled = Math.round(progress * segments);
    const gap = 4;
    return (
      <View style={{ flexDirection: 'row', gap }}>
        {Array.from({ length: segments }, (_, i) => (
          <SegmentBlock key={i} filled={i < filled} height={height} color={color} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {railPath && w > 0 && (
        <Canvas pointerEvents="none" style={{ position: 'absolute', inset: 0, width: w, height }}>
          {/* Rail */}
          <SkPath path={railPath} color="rgba(255,255,255,0.08)" style="fill" />

          {/* Remplissage clippé par le rail */}
          <Group clip={railPath}>
            <SkRect x={0} y={0} width={fillWidth} height={height}>
              <SkLinearGradient
                start={vec(0, height / 2)}
                end={vec(w, height / 2)}
                colors={[color, colorEnd]}
              />
            </SkRect>
          </Group>

          {/* Tête lumineuse */}
          <SkCircle cx={headX} cy={height / 2} r={height / 2 + 1} color={colorEnd}>
            <BlurMask blur={6} style="normal" />
          </SkCircle>

          {/* Ticks de graduation */}
          {ticks &&
            [0.25, 0.5, 0.75].map((t) => (
              <SkRect
                key={t}
                x={w * t}
                y={1}
                width={1}
                height={height - 2}
                color="rgba(2,8,16,0.8)"
              />
            ))}

          {/* Bordure du rail */}
          <SkPath path={railPath} color={hud.border.hairline} style="stroke" strokeWidth={1} />
        </Canvas>
      )}
    </View>
  );
}

function SegmentBlock({ filled, height, color }: { filled: boolean; height: number; color: string }) {
  const [w, setW] = useState(0);
  const cut = Math.min(4, height / 2);
  const path = useMemo(
    () => (w > 0 ? Skia.Path.MakeFromSVGString(octagonSVG(0.5, 0.5, w - 1, height - 1, cut))! : null),
    [w, height, cut],
  );
  const opacity = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(filled ? 1 : 0, { duration: 300 });
  }, [filled]);

  return (
    <View style={{ flex: 1, height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {path && (
        <Canvas pointerEvents="none" style={{ position: 'absolute', inset: 0, width: w, height }}>
          <SkPath path={path} color="rgba(255,255,255,0.08)" style="fill" />
          <Group clip={path}>
            <SkRect x={0} y={0} width={w} height={height} color={color} opacity={opacity} />
          </Group>
          <SkPath path={path} color={hud.border.hairline} style="stroke" strokeWidth={1} />
        </Canvas>
      )}
    </View>
  );
}
