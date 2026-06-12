/**
 * CONFETTI BURST — pluie de confettis OCTOGONAUX en un seul Canvas Skia
 * (DESIGN-GYMTRACK.md §B.9). Physique précalculée : vélocité initiale
 * vers le haut + gravité + rotation ; un seul progress partagé anime
 * toutes les particules sur le thread UI. One-shot, se démonte seul.
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Path as SkPath, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { octagonPath } from '@/components/ui/hud/octagon';

type Particle = {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  rot: number;
  size: number;
  color: string;
};

export type ConfettiBurstProps = {
  count?: number;
  colors: string[];
  /** Point d'émission (par défaut : centre horizontal, 35 % de hauteur). */
  origin?: { x: number; y: number };
  duration?: number;
  onDone?: () => void;
};

function ConfettiPiece({ p, progress }: { p: Particle; progress: SharedValue<number> }) {
  const path = useMemo(
    () => octagonPath(-p.size / 2, -p.size / 2, p.size, p.size, p.size * 0.3),
    [p.size],
  );
  const transform = useDerivedValue(() => {
    const t = progress.value;
    return [
      { translateX: p.x0 + p.vx * t },
      { translateY: p.y0 + p.vy * t + 650 * t * t },
      { rotate: p.rot * t },
    ];
  });
  const opacity = useDerivedValue(() =>
    progress.value < 0.7 ? 1 : Math.max(0, 1 - (progress.value - 0.7) / 0.3),
  );
  return (
    <Group transform={transform}>
      <SkPath path={path} color={p.color} opacity={opacity} />
    </Group>
  );
}

export function ConfettiBurst({
  count = 36,
  colors,
  origin,
  duration = 2000,
  onDone,
}: ConfettiBurstProps) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  const particles = useMemo<Particle[]>(() => {
    const ox = origin?.x ?? width / 2;
    const oy = origin?.y ?? height * 0.35;
    return Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 220 + Math.random() * 380;
      return {
        x0: ox + (Math.random() - 0.5) * 40,
        y0: oy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: (Math.random() - 0.5) * Math.PI * 6,
        size: 7 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#FFFFFF',
      };
    });
  }, []);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      },
    );
  }, []);

  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <ConfettiPiece key={i} p={p} progress={progress} />
      ))}
    </Canvas>
  );
}
