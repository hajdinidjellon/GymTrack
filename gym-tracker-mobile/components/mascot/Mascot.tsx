/**
 * MASCOT — sprite sheets
 * mimi.png                     : 1630×965  — personnage féminin principal
 * mascotte-mimi2.png           : 1369×1149 — mimi2 statiques (name, bench, squat, frequency)
 * mascotte-mimi3.png           : 1536×1024 — mimi3 (deadlift statique, célébration)
 * mascotte-mimi5.png           : 1536×1024 — Mimi onboarding goals (balance, target, cardio, anatomy, mesure, calendar, clock, sports, bell)
 * mascotte-mimi-mouvement1.png : 1417×1110 — 9 frames animées squat/bench/deadlift (3×3)
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, Pressable, Animated, Easing } from 'react-native';

const SHEET_MIMI  = require('@/assets/mascot/mimi.png')                       as number;
const SHEET_MIMI2 = require('@/assets/mascot/mascotte-mimi2.png')             as number;
const SHEET_MIMI3 = require('@/assets/mascot/mascotte-mimi3.png')             as number;
const SHEET_MIMI5 = require('@/assets/mascot/mascotte-mimi5.png')             as number;
const SHEET_MOUV1 = require('@/assets/mascot/mascotte-mimi-mouvement1.png')   as number;
const SHEET_CELEB    = require('@/assets/mascot/mascotte-celebration.png')    as number;
const SHEET_TROPHY   = require('@/assets/mascot/mascotte-trophy.png')         as number;

type PoseDef = {
  x: number; y: number; w: number; h: number;
  imgW: number; imgH: number;
  src: number;
};

export type MascotPose =
  // ── mimi 1630×965 ───────────────────────────────────────────────
  | 'mimi_goal' | 'mimi_level'
  // ── mascotte-mimi2 1369×1149 — statiques ────────────────────────
  | 'mimi2_name' | 'mimi2_bench' | 'mimi2_squat' | 'mimi2_frequency'
  // ── mascotte-mimi3 1536×1024 ────────────────────────────────────
  | 'mimi3_deadlift' | 'mimi3_done'
  // ── mascotte-mimi5 1536×1024 — onboarding goals ─────────────────
  | 'mimi_balance'  | 'mimi_target'   | 'mimi_cardio'  | 'mimi_anatomy'
  | 'mimi_mesure'   | 'mimi_calendar' | 'mimi_clock'
  | 'mimi_sports'   | 'mimi_bell'
  // ── mascotte-cache 1536×1024 — welcome ──────────────────────────
  | 'cache_hidden' | 'cache_revealed'
  // ── mascotte-cache3 1536×1024 — name ────────────────────────────
  | 'cache3_pos1' | 'cache3_pos2'
  // ── mascotte-cache4 1536×1024 — goal ────────────────────────────
  | 'cache4_pos1' | 'cache4_pos2'
  // ── mascotte-mimi-mouvement1 1417×1110 — frames animées ─────────
  | 'mouv_squat_1'  | 'mouv_squat_2'  | 'mouv_squat_3'
  | 'mouv_bench_1'  | 'mouv_bench_2'  | 'mouv_bench_3'
  | 'mouv_dead_1'   | 'mouv_dead_2'   | 'mouv_dead_3'
  // ── mascotte-celebration 1536×1024 — 3 frames célébration ────────
  | 'celebrate_1' | 'celebrate_2' | 'celebrate_3'
  // ── mascotte-trophy 1536×1024 — 2 frames trophée ─────────────────
  | 'trophy_1' | 'trophy_2';

export const POSES: Record<MascotPose, PoseDef> = {
  // ── mimi 1630×965 ────────────────────────────────────────────────
  mimi_goal:   { x: 459, y: 90,  w: 285, h: 320, imgW: 1630, imgH: 965, src: SHEET_MIMI },
  mimi_level:  { x: 844, y: 492, w: 284, h: 357, imgW: 1630, imgH: 965, src: SHEET_MIMI },

  // ── mascotte-mimi2 1369×1149 — statiques ─────────────────────────
  mimi2_name:      { x: 92,   y: 76,  w: 212, h: 286, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_bench:     { x: 44,   y: 452, w: 307, h: 258, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_squat:     { x: 694,  y: 456, w: 301, h: 238, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_frequency: { x: 1042, y: 485, w: 251, h: 210, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },

  // ── mascotte-mimi3 1536×1024 ─────────────────────────────────────
  mimi3_deadlift: { x: 429, y: 394, w: 321, h: 277, imgW: 1536, imgH: 1024, src: SHEET_MIMI3 },
  mimi3_done:     { x: 429, y: 47,  w: 321, h: 312, imgW: 1536, imgH: 1024, src: SHEET_MIMI3 },

  // ── mascotte-mimi5 1536×1024 — Mimi onboarding goals ─────────────
  mimi_balance:  { x: 72,   y: 25,  w: 249, h: 339, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_target:   { x: 406,  y: 25,  w: 358, h: 339, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_cardio:   { x: 806,  y: 25,  w: 266, h: 339, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_anatomy:  { x: 1162, y: 25,  w: 339, h: 339, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_mesure:   { x: 72,   y: 384, w: 249, h: 311, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_calendar: { x: 832,  y: 373, w: 241, h: 322, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_clock:    { x: 1152, y: 352, w: 349, h: 343, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_sports:   { x: 1142, y: 693, w: 339, h: 306, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },
  mimi_bell:     { x: 444,  y: 706, w: 261, h: 296, imgW: 1536, imgH: 1024, src: SHEET_MIMI5 },

  // ── mascotte-cache 1536×1024 — welcome peek ───────────────────────
  cache_hidden:   { x: 199, y: 78,  w: 309, h: 837, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache.png') as number },
  cache_revealed: { x: 905, y: 78,  w: 449, h: 837, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache.png') as number },

  // ── mascotte-cache3 1536×1024 — name screen ───────────────────────
  cache3_pos1: { x: 544, y: 702, w: 195, h: 248, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache3.png') as number },
  cache3_pos2: { x: 738, y: 702, w: 218, h: 248, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache3.png') as number },

  // ── mascotte-cache4 1536×1024 — goal screen ───────────────────────
  cache4_pos1: { x: 52,  y: 44, w: 143, h: 236, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache4.png') as number },
  cache4_pos2: { x: 198, y: 44, w: 161, h: 236, imgW: 1536, imgH: 1024, src: require('@/assets/mascot/mascotte-cache4.png') as number },

  // ── mascotte-celebration 1536×1024 — célébration PR ─────────────
  celebrate_1: { x: 117,  y: 468, w: 294, h: 311, imgW: 1536, imgH: 1024, src: SHEET_CELEB },
  celebrate_2: { x: 606,  y: 293, w: 360, h: 486, imgW: 1536, imgH: 1024, src: SHEET_CELEB },
  celebrate_3: { x: 1112, y: 422, w: 322, h: 358, imgW: 1536, imgH: 1024, src: SHEET_CELEB },

  // ── mascotte-trophy 1536×1024 — objectif / badge ─────────────────
  trophy_1: { x: 266, y: 320, w: 387, h: 471, imgW: 1536, imgH: 1024, src: SHEET_TROPHY },
  trophy_2: { x: 832, y: 210, w: 429, h: 581, imgW: 1536, imgH: 1024, src: SHEET_TROPHY },

  // ── mascotte-mimi-mouvement1 1417×1110 — squat ───────────────────
  mouv_squat_1: { x: 19,   y: 27,  w: 360, h: 306, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_squat_2: { x: 1033, y: 27,  w: 331, h: 306, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_squat_3: { x: 705,  y: 27,  w: 331, h: 306, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },

  // ── mascotte-mimi-mouvement1 1417×1110 — bench ───────────────────
  mouv_bench_1: { x: 25,   y: 384, w: 342, h: 301, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_bench_2: { x: 373,  y: 378, w: 339, h: 309, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_bench_3: { x: 709,  y: 379, w: 322, h: 305, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },

  // ── mascotte-mimi-mouvement1 1417×1110 — deadlift ────────────────
  mouv_dead_1:  { x: 19,   y: 726, w: 312, h: 298, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_dead_2:  { x: 700,  y: 726, w: 287, h: 298, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
  mouv_dead_3:  { x: 996,  y: 724, w: 346, h: 303, imgW: 1417, imgH: 1110, src: SHEET_MOUV1 },
};

// ── Rendu d'une frame de sprite ───────────────────────────────────
function SpriteFrame({ pose, height }: { pose: MascotPose; height: number }) {
  const crop  = POSES[pose];
  const scale = height / crop.h;
  const dispW = crop.w * scale;
  return (
    <View style={{ width: dispW, height, overflow: 'hidden' }}>
      <Image
        source={crop.src}
        style={{
          width:      crop.imgW * scale,
          height:     crop.imgH * scale,
          marginLeft: -crop.x * scale,
          marginTop:  -crop.y * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────
interface MascotProps {
  pose: MascotPose;
  height?: number;
  animate?: boolean;
  float?: boolean;
}

// ── Composant statique ────────────────────────────────────────────
export function Mascot({ pose, height = 160, animate = true, float = false }: MascotProps) {
  const crop  = POSES[pose];
  const scale = height / crop.h;
  const dispW = crop.w * scale;

  const opacity    = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 16 : 0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(16);
    if (!animate) { opacity.setValue(1); translateY.setValue(0); return; }
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [pose]);

  useEffect(() => {
    if (!float) { floatY.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: Animated.add(translateY, floatY) }] }}>
      <View style={{ width: dispW, height, overflow: 'hidden' }}>
        <Image
          source={crop.src}
          style={{
            width:      crop.imgW * scale,
            height:     crop.imgH * scale,
            marginLeft: -crop.x * scale,
            marginTop:  -crop.y * scale,
          }}
          resizeMode="stretch"
        />
      </View>
    </Animated.View>
  );
}

// ── Composant animation exercice (2 frames : A → B → A → B…) ─────
// Les 2 frames sont pré-rendues en absolu, switch d'opacité instantané
// via Animated.loop — zéro re-render, zéro clignotement.
export function AnimatedExerciseMascot({
  frames,
  height = 160,
  frameDuration = 600,
}: {
  frames: [MascotPose, MascotPose];
  height?: number;
  frameDuration?: number;
}) {
  const opA = useRef(new Animated.Value(1)).current;
  const opB = useRef(new Animated.Value(0)).current;

  const maxW = Math.max(
    POSES[frames[0]].w * (height / POSES[frames[0]].h),
    POSES[frames[1]].w * (height / POSES[frames[1]].h),
  );

  useEffect(() => {
    opA.setValue(1);
    opB.setValue(0);

    const toggle = (hide: Animated.Value, show: Animated.Value) =>
      Animated.sequence([
        Animated.delay(frameDuration),
        Animated.parallel([
          Animated.timing(hide, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(show, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ]);

    const loop = Animated.loop(
      Animated.sequence([
        toggle(opA, opB),
        toggle(opB, opA),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [frameDuration]);

  const renderFrame = (pose: MascotPose, op: Animated.Value, key: number) => {
    const crop  = POSES[pose];
    const scale = height / crop.h;
    const dispW = crop.w * scale;
    return (
      <Animated.View
        key={key}
        style={{ position: 'absolute', top: 0, left: (maxW - dispW) / 2, opacity: op }}
      >
        <SpriteFrame pose={pose} height={height} />
      </Animated.View>
    );
  };

  return (
    <View style={{ width: maxW, height }}>
      {renderFrame(frames[0], opA, 0)}
      {renderFrame(frames[1], opB, 1)}
    </View>
  );
}

// ── Mascotte à deux poses — tap pour alterner ─────────────────────
export function ToggleMascot({
  poseA,
  poseB,
  height = 140,
  slideOffset = 0,
}: {
  poseA: MascotPose;
  poseB: MascotPose;
  height?: number;
  /** Décalage X (px) appliqué à poseB quand elle apparaît */
  slideOffset?: number;
}) {
  const revealedRef = useRef(false);
  const opA = useRef(new Animated.Value(1)).current;
  const opB = useRef(new Animated.Value(0)).current;
  // Slide appliqué uniquement à poseB — poseA ne bouge jamais
  const txB = useRef(new Animated.Value(0)).current;

  const maxW = Math.max(
    POSES[poseA].w * (height / POSES[poseA].h),
    POSES[poseB].w * (height / POSES[poseB].h),
  );

  const handlePress = () => {
    revealedRef.current = !revealedRef.current;
    const show = revealedRef.current;
    Animated.parallel([
      Animated.timing(opA, { toValue: show ? 0 : 1, duration: 180, useNativeDriver: true }),
      Animated.timing(opB, { toValue: show ? 1 : 0, duration: 180, useNativeDriver: true }),
      Animated.spring(txB, {
        toValue: show ? slideOffset : 0,
        speed: 14, bounciness: 6, useNativeDriver: true,
      }),
    ]).start();
  };

  const cropA = POSES[poseA]; const scaleA = height / cropA.h;
  const cropB = POSES[poseB]; const scaleB = height / cropB.h;

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <View style={{ width: maxW, height }}>
        {/* poseA — fixe, ne bouge jamais */}
        <Animated.View style={{ position: 'absolute', top: 0, left: (maxW - cropA.w * scaleA) / 2, opacity: opA }}>
          <SpriteFrame pose={poseA} height={height} />
        </Animated.View>
        {/* poseB — slide uniquement sur cette frame */}
        <Animated.View style={{ position: 'absolute', top: 0, left: (maxW - cropB.w * scaleB) / 2, opacity: opB, transform: [{ translateX: txB }] }}>
          <SpriteFrame pose={poseB} height={height} />
        </Animated.View>
      </View>
    </Pressable>
  );
}
