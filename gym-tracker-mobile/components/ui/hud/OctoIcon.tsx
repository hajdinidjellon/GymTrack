/**
 * OCTO ICON — icône posée dans un octogone (40/48/64).
 * Fond surfaceDeep, bordure G0→G2 selon l'état.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Path as SkPath, BlurMask } from '@shopify/react-native-skia';
import { hud, type HudGlowLevel } from '@/constants/theme';
import { octagonPath } from './octagon';

const PAD = 16;

export type OctoIconProps = {
  size?: 40 | 48 | 64 | number;
  level?: HudGlowLevel;
  /** Couleur de bordure custom (rang, rareté…). */
  borderColor?: string;
  glowColor?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
};

export function OctoIcon({
  size = 40,
  level = 'g0',
  borderColor,
  glowColor,
  backgroundColor = hud.bg.surfaceDeep,
  children,
}: OctoIconProps) {
  const spec = hud.glowLevel[level];
  const cut = Math.max(6, Math.round(size * 0.18));
  const path = useMemo(() => octagonPath(PAD, PAD, size, size, cut), [size, cut]);
  const border = borderColor ?? spec.border;
  const glow = glowColor ?? spec.glowColor;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -PAD,
          left: -PAD,
          width: size + PAD * 2,
          height: size + PAD * 2,
        }}
      >
        {spec.blur > 0 && (
          <SkPath path={path} color={glow} style="fill">
            <BlurMask blur={spec.blur} style="normal" />
          </SkPath>
        )}
        <SkPath path={path} color={backgroundColor} style="fill" />
        <SkPath path={path} color={border} style="stroke" strokeWidth={spec.borderWidth} />
      </Canvas>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
