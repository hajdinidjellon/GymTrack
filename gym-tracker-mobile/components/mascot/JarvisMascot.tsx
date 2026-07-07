/**
 * JARVIS — la mascotte ourson holographique de GymTrack.
 * Poses PNG (assets/mascot/jarvis) pilotées par le même vocabulaire de moods
 * que NexusOrb : le mood choisit la pose + le glow + les micro-animations
 * (float désynchronisé, respiration, réactions). Jamais immobile
 * (NEXUS_SPEC.md §3), amplitudes faibles.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';
import type { NexusMood } from '@/components/mascot/NexusOrb';

export type JarvisMood = NexusMood | 'sleepy';
export type JarvisExerciseName = 'bench' | 'squat' | 'deadlift';

const POSES: Record<JarvisMood, number> = {
  idle:       require('@/assets/mascot/jarvis/jarvis_idle.png') as number,
  talking:    require('@/assets/mascot/jarvis/jarvis_talking.png') as number,
  listening:  require('@/assets/mascot/jarvis/jarvis_listening.png') as number,
  processing: require('@/assets/mascot/jarvis/jarvis_processing.png') as number,
  celebrate:  require('@/assets/mascot/jarvis/jarvis_celebrate.png') as number,
  concerned:  require('@/assets/mascot/jarvis/jarvis_concerned.png') as number,
  sleepy:     require('@/assets/mascot/jarvis/jarvis_sleepy.png') as number,
};

const EXERCISE_FRAMES: Record<JarvisExerciseName, [number, number]> = {
  bench: [
    require('@/assets/mascot/jarvis/jarvis_bench_a.png') as number,
    require('@/assets/mascot/jarvis/jarvis_bench_b.png') as number,
  ],
  squat: [
    require('@/assets/mascot/jarvis/jarvis_squat_a.png') as number,
    require('@/assets/mascot/jarvis/jarvis_squat_b.png') as number,
  ],
  deadlift: [
    require('@/assets/mascot/jarvis/jarvis_deadlift_a.png') as number,
    require('@/assets/mascot/jarvis/jarvis_deadlift_b.png') as number,
  ],
};

/** Paramètres du « souffle de vie » par mood. */
const MOOD_PARAMS: Record<
  JarvisMood,
  { floatAmp: number; floatMs: number; pulseAmp: number; pulseMs: number; glow: number; tiltDeg: number }
> = {
  idle:       { floatAmp: 4, floatMs: 1500, pulseAmp: 0.015, pulseMs: 1600, glow: 0.40, tiltDeg: 0 },
  talking:    { floatAmp: 3, floatMs: 1200, pulseAmp: 0.035, pulseMs: 340,  glow: 0.55, tiltDeg: 0 },
  listening:  { floatAmp: 3, floatMs: 1900, pulseAmp: 0.012, pulseMs: 2000, glow: 0.35, tiltDeg: -4 },
  processing: { floatAmp: 2, floatMs: 900,  pulseAmp: 0.030, pulseMs: 260,  glow: 0.80, tiltDeg: 3 },
  celebrate:  { floatAmp: 9, floatMs: 460,  pulseAmp: 0.050, pulseMs: 460,  glow: 0.95, tiltDeg: 0 },
  concerned:  { floatAmp: 2, floatMs: 2400, pulseAmp: 0.010, pulseMs: 2600, glow: 0.30, tiltDeg: 0 },
  sleepy:     { floatAmp: 2, floatMs: 3000, pulseAmp: 0.020, pulseMs: 3200, glow: 0.18, tiltDeg: 2 },
};

const GLOW_PAD = 36;

export type JarvisMascotProps = {
  /** Hauteur visuelle de l'ourson. */
  size?: number;
  mood?: JarvisMood;
  style?: StyleProp<ViewStyle>;
};

export function JarvisMascot({ size = 120, mood = 'idle', style }: JarvisMascotProps) {
  const params = MOOD_PARAMS[mood];
  const S = size + GLOW_PAD * 2;

  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const glow = useSharedValue(params.glow);

  useEffect(() => {
    const p = MOOD_PARAMS[mood];

    cancelAnimation(floatY);
    floatY.value = 0;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-p.floatAmp, { duration: p.floatMs, easing: Easing.inOut(Easing.sin) }),
        withTiming(p.floatAmp, { duration: p.floatMs, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    cancelAnimation(scale);
    // celebrate : pop d'arrivée avant la pulsation en boucle
    scale.value = mood === 'celebrate' ? 0.85 : scale.value;
    scale.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 180 }),
      withRepeat(
        withSequence(
          withTiming(1 + p.pulseAmp, { duration: p.pulseMs, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: p.pulseMs, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    tilt.value = withTiming(p.tiltDeg, { duration: 350, easing: Easing.out(Easing.cubic) });
    glow.value = withTiming(p.glow, { duration: 450 });

    return () => {
      cancelAnimation(floatY);
      cancelAnimation(scale);
    };
  }, [mood]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.94 + glow.value * 0.12 }],
  }));

  // concerned → halo ambré, sinon cyan (cohérent avec NexusOrb)
  const glowColor = mood === 'concerned' ? 'rgba(245,166,35,0.55)' : 'rgba(29,196,255,0.55)';

  return (
    <View
      style={[{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }, style]}
      pointerEvents="none"
    >
      <Animated.View style={[{ position: 'absolute', width: S, height: S }, glowStyle]}>
        <Canvas style={{ width: S, height: S }}>
          <Circle cx={S / 2} cy={S / 2} r={size * 0.46} color={glowColor}>
            <BlurMask blur={30} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>
      <Animated.View style={bodyStyle}>
        <Image
          source={POSES[mood]}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export type JarvisExerciseProps = {
  exercise: JarvisExerciseName;
  size?: number;
  /** ms entre les deux frames (rythme de la répétition). */
  frameDuration?: number;
  style?: StyleProp<ViewStyle>;
};

/** Jarvis à l'entraînement : alterne les deux frames de l'exercice. */
export function JarvisExercise({
  exercise, size = 150, frameDuration = 700, style,
}: JarvisExerciseProps) {
  const [frame, setFrame] = useState(0);
  const frames = EXERCISE_FRAMES[exercise];

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), frameDuration);
    return () => clearInterval(id);
  }, [exercise, frameDuration]);

  const S = size + GLOW_PAD * 2;
  // les scènes d'exercice sont plus larges que hautes
  const imgW = size * 1.35;

  return (
    <View
      style={[{ width: S + imgW - size, height: S, alignItems: 'center', justifyContent: 'center' }, style]}
      pointerEvents="none"
    >
      <View style={{ position: 'absolute', width: S, height: S }}>
        <Canvas style={{ width: S, height: S }}>
          <Circle cx={S / 2} cy={S / 2} r={size * 0.48} color="rgba(29,196,255,0.45)">
            <BlurMask blur={30} style="normal" />
          </Circle>
        </Canvas>
      </View>
      <Image
        source={frames[frame]}
        style={{ width: imgW, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
