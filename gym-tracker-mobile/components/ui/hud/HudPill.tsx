/**
 * HUD PILL — pill octogonale pour types de série, tags, états.
 * Fond = couleur à 15 %, texte = couleur pleine, label 11 UPPERCASE.
 */
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Path as SkPath } from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';
import { octagonPath } from './octagon';

export type HudPillProps = {
  label: string;
  /** Couleur pleine — le fond est dérivé automatiquement à 15 %. */
  color?: string;
  /** Fond explicite si la couleur dérivée ne convient pas. */
  backgroundColor?: string;
  size?: 'sm' | 'md';
};

function dimColor(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 'rgba(255,255,255,0.10)';
  return `rgba(${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)},0.15)`;
}

export function HudPill({ label, color = hud.cyan.primary, backgroundColor, size = 'sm' }: HudPillProps) {
  const [w, setW] = useState(0);
  const h = size === 'sm' ? 22 : 28;
  const fontSize = size === 'sm' ? 10 : 12;
  const bg = backgroundColor ?? dimColor(color);
  const path = useMemo(
    () => (w > 0 ? octagonPath(0.5, 0.5, w - 1, h - 1, hud.cut.sm) : null),
    [w, h],
  );

  return (
    <View
      style={{ height: h, justifyContent: 'center', alignSelf: 'flex-start' }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {path && (
        <Canvas pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
          <SkPath path={path} color={bg} style="fill" />
          <SkPath path={path} color={color} style="stroke" strokeWidth={1} opacity={0.6} />
        </Canvas>
      )}
      <Text
        style={{
          fontFamily: 'Rajdhani-SemiBold',
          fontSize,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color,
          paddingHorizontal: 10,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
