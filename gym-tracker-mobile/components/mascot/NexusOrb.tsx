/**
 * NEXUS — mascotte holographique procédurale (NEXUS_SPEC.md).
 * Orbe core cyan + 2 anneaux octogonaux contre-rotatifs + glow Skia.
 * 100% Skia + Reanimated (UI thread), zéro asset externe.
 *
 * États émotionnels (machine à états maison, §4 du spec) :
 *   idle | talking | listening | processing | celebrate | concerned
 *
 * Couche « vie » permanente (§3) : respiration, flottement désynchronisé,
 * anneaux en rotation continue, dérive de l'iris, impulsion de scan.
 */
import React, { useEffect, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  Circle as SkCircle,
  Group as SkGroup,
  BlurMask,
  DashPathEffect,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useFrameCallback,
  withTiming,
  withSpring,
  withSequence,
  interpolateColor,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { hud, motion } from '@/constants/theme';

export type NexusMood =
  | 'idle'
  | 'talking'
  | 'listening'
  | 'processing'
  | 'celebrate'
  | 'concerned';

/** Cibles par état : vitesse anneaux, intensité glow, teinte (0=cyan 1=ambre),
 *  écartement des anneaux, amplitude/fréquence de pulsation du core. */
const MOOD_PARAMS: Record<
  NexusMood,
  { speed: number; glow: number; tint: number; spread: number; pulseAmp: number; pulseHz: number }
> = {
  idle:       { speed: 1,    glow: 0.40, tint: 0, spread: 1,    pulseAmp: 0.030, pulseHz: 0.31 },
  talking:    { speed: 1.35, glow: 0.55, tint: 0, spread: 1,    pulseAmp: 0.065, pulseHz: 1.7  },
  listening:  { speed: 0.45, glow: 0.35, tint: 0, spread: 0.96, pulseAmp: 0.022, pulseHz: 0.25 },
  processing: { speed: 3.6,  glow: 0.80, tint: 0, spread: 1.06, pulseAmp: 0.050, pulseHz: 2.2  },
  celebrate:  { speed: 2.2,  glow: 0.90, tint: 0, spread: 1.16, pulseAmp: 0.080, pulseHz: 2.8  },
  concerned:  { speed: 0.35, glow: 0.28, tint: 1, spread: 0.88, pulseAmp: 0.020, pulseHz: 0.18 },
};

/** Octogone régulier (anneau) centré en (c,c), rayon r. */
function ringOctagonSVG(c: number, r: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (Math.PI / 4) * k + Math.PI / 8;
    pts.push(`${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

const GLOW_PAD = 44;

export type NexusOrbProps = {
  /** Diamètre visuel de l'orbe (ancre §5 : 120 onboarding, 96 timer, 72 accueil…). */
  size?: number;
  mood?: NexusMood;
  style?: StyleProp<ViewStyle>;
};

export function NexusOrb({ size = 120, mood = 'idle', style }: NexusOrbProps) {
  const S = size + GLOW_PAD * 2;
  const c = S / 2;
  const coreR = size * 0.21;
  const ringAR = size * 0.345;
  const ringBR = size * 0.465;

  // ── Horloge unique (UI thread) — rotations + phase de vie ────────
  const phase = useSharedValue(0);
  const rotA = useSharedValue(0);
  const rotB = useSharedValue(0);

  // Cibles pilotées par le mood (animées, jamais sèches)
  const speed = useSharedValue(1);
  const glowMax = useSharedValue(MOOD_PARAMS.idle.glow);
  const tint = useSharedValue(0);
  const spread = useSharedValue(1);
  const pulseAmp = useSharedValue(MOOD_PARAMS.idle.pulseAmp);
  const pulseHz = useSharedValue(MOOD_PARAMS.idle.pulseHz);
  const flash = useSharedValue(0);

  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 16;
    phase.value += dt;
    // Vitesses de base non multiples (2π/9s et 2π/14.5s), sens opposés (§3)
    rotA.value += dt * 0.000698 * speed.value;
    rotB.value -= dt * 0.000433 * speed.value;
  });

  useEffect(() => {
    const p = MOOD_PARAMS[mood];
    speed.value = withTiming(p.speed, { duration: 450, easing: Easing.out(Easing.cubic) });
    glowMax.value = withTiming(p.glow, { duration: 450 });
    tint.value = withTiming(p.tint, { duration: 600 });
    pulseAmp.value = withTiming(p.pulseAmp, { duration: 300 });
    pulseHz.value = withTiming(p.pulseHz, { duration: 300 });

    if (mood === 'celebrate') {
      // Flash + anneaux qui s'écartent puis reviennent (§4)
      flash.value = withSequence(
        withTiming(1, { duration: 110 }),
        withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
      );
      spread.value = withSequence(
        withSpring(p.spread + 0.14, motion.springCelebration),
        withSpring(p.spread, motion.spring),
      );
    } else {
      spread.value = withSpring(p.spread, motion.spring);
    }
    return () => {
      cancelAnimation(spread);
      cancelAnimation(flash);
    };
  }, [mood]);

  // ── Couche vie : respiration, flottement, iris, scan ─────────────
  const TWO_PI = Math.PI * 2;

  const coreTransform = useDerivedValue(() => {
    const s = 1 + pulseAmp.value * Math.sin((TWO_PI * pulseHz.value * phase.value) / 1000);
    return [{ scale: s }];
  });

  const glowOpacity = useDerivedValue(
    () => glowMax.value * (0.72 + 0.28 * Math.sin(phase.value / 510)),
  );

  const ringATransform = useDerivedValue(() => [
    { rotate: rotA.value },
    { scale: spread.value },
  ]);
  const ringBTransform = useDerivedValue(() => [
    { rotate: rotB.value },
    { scale: spread.value * (1 + 0.015 * Math.sin(phase.value / 830)) },
  ]);

  // Dérive lente de l'iris (périodes non multiples — §3)
  const irisX = useDerivedValue(() => c + coreR * 0.22 * Math.sin(phase.value / 1730));
  const irisY = useDerivedValue(() => c + coreR * 0.18 * Math.sin(phase.value / 2310));

  // Impulsion de scan : un anneau fin s'étend et disparaît (~toutes les 9s)
  const scanT = useDerivedValue(() => (phase.value % 9000) / 1300);
  const scanR = useDerivedValue(() => coreR * (1 + Math.min(scanT.value, 1) * 2.4));
  const scanOpacity = useDerivedValue(() =>
    scanT.value >= 1 ? 0 : (1 - scanT.value) * 0.30,
  );

  const flashOpacity = useDerivedValue(() => flash.value * 0.55);

  // Teinte cyan → ambre (concerned)
  const coreColor = useDerivedValue(() =>
    interpolateColor(tint.value, [0, 1], [hud.cyan.bright, hud.accent.warn]),
  );
  const ringColor = useDerivedValue(() =>
    interpolateColor(tint.value, [0, 1], [hud.cyan.primary, hud.accent.warn]),
  );

  // Flottement du conteneur (x/y désynchronisés)
  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: 4 * Math.sin((phase.value / 2800) * TWO_PI) },
      { translateX: 2 * Math.sin((phase.value / 4100) * TWO_PI) },
    ],
  }));

  const ringAPath = useMemo(() => ringOctagonSVG(c, ringAR), [c, ringAR]);
  const ringBPath = useMemo(() => ringOctagonSVG(c, ringBR), [c, ringBR]);
  const origin = useMemo(() => vec(c, c), [c]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ width: size, height: size }, floatStyle, style]}
    >
      <Canvas
        style={{
          position: 'absolute',
          top: -GLOW_PAD,
          left: -GLOW_PAD,
          width: S,
          height: S,
        }}
      >
        {/* Halo externe qui respire */}
        <SkCircle cx={c} cy={c} r={coreR * 2.1} color={ringColor} opacity={glowOpacity}>
          <BlurMask blur={26} style="normal" />
        </SkCircle>

        {/* Anneau externe (pointillé, rotation anti-horaire) */}
        <SkGroup origin={origin} transform={ringBTransform}>
          <SkPath path={ringBPath} color={ringColor} style="stroke" strokeWidth={1.3} opacity={0.55}>
            <DashPathEffect intervals={[16, 9]} />
          </SkPath>
        </SkGroup>

        {/* Anneau interne (plein, rotation horaire) */}
        <SkGroup origin={origin} transform={ringATransform}>
          <SkPath path={ringAPath} color={ringColor} style="stroke" strokeWidth={1.8} opacity={0.9} />
        </SkGroup>

        {/* Impulsion de scan */}
        <SkCircle
          cx={c} cy={c} r={scanR}
          color={ringColor} style="stroke" strokeWidth={1}
          opacity={scanOpacity}
        />

        {/* Core : halo + disque sombre + iris qui dérive + point brillant */}
        <SkGroup origin={origin} transform={coreTransform}>
          <SkCircle cx={c} cy={c} r={coreR} color={coreColor} opacity={0.9}>
            <BlurMask blur={9} style="normal" />
          </SkCircle>
          <SkCircle cx={c} cy={c} r={coreR * 0.82} color={hud.bg.surfaceDeep} opacity={0.92} />
          <SkCircle cx={irisX} cy={irisY} r={coreR * 0.42} color={coreColor} opacity={0.85}>
            <BlurMask blur={4} style="normal" />
          </SkCircle>
          <SkCircle cx={irisX} cy={irisY} r={coreR * 0.15} color={hud.text.primary} opacity={0.95} />
        </SkGroup>

        {/* Flash de célébration */}
        <SkCircle cx={c} cy={c} r={coreR * 2.6} color={hud.cyan.bright} opacity={flashOpacity}>
          <BlurMask blur={30} style="normal" />
        </SkCircle>
      </Canvas>
    </Animated.View>
  );
}
