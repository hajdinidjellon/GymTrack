/**
 * MASCOT — sprite sheets
 * mascot_sheet.png    : 1408×768 — 12 poses (ancien ours)
 * mascotte2.png       : 1376×768 — variantes (pensive, etc.)
 * mascotte3.png       : 1376×768 — wave / celebrate
 * mascotte4.png       : 1376×768 — squat / deadlift
 * mascotte5.png       : 1376×768 — laugh, pushup, jumprope, run, flex_v2, chocolate
 * mimi.png            : 1630×965 — personnage féminin principal
 * mascotte-mimi2.png  : 1376×768 — variantes mimi2 (name, bench, squat, frequency)
 * mascotte-mimi3.png  : 1376×768 — variantes mimi3 (deadlift, celebration)
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';

const SHEET_OLD  = require('@/assets/mascot/mascot_sheet.png')       as number;
const SHEET_2    = require('@/assets/mascot/mascotte2.png')           as number;
const SHEET_3    = require('@/assets/mascot/mascotte3.png')           as number;
const SHEET_4    = require('@/assets/mascot/mascotte4.png')           as number;
const SHEET_5    = require('@/assets/mascot/mascotte5.png')           as number;
const SHEET_MIMI  = require('@/assets/mascot/mimi.png')               as number;
const SHEET_MIMI2 = require('@/assets/mascot/mascotte-mimi2.png')     as number;
const SHEET_MIMI3 = require('@/assets/mascot/mascotte-mimi3.png')     as number;

type PoseDef = {
  x: number; y: number; w: number; h: number;
  imgW: number; imgH: number;
  src: number;
};

export type MascotPose =
  // ── Ancien sheet ──────────────────────────────────────────────────
  | 'rack'            // avec barre de traction
  | 'bench_curl'      // assis avec haltère
  | 'lecture'         // lit un livre
  | 'overhead'        // développé militaire
  | 'flex'            // pose musclée
  | 'serviette'       // serviette sur la tête
  | 'shaker'          // boit son shaker
  | 'shy'             // cache ses yeux
  | 'halteres'        // haltères au sol
  | 'sac'             // sac de sport
  | 'casque'          // casque / ceinture
  | 'repos'           // assis qui se repose
  // ── Sheet mascotte3 ───────────────────────────────────────────────
  | 'wave'            // fait coucou de la main
  | 'celebrate'       // célèbre / bras en l'air
  // ── Sheet mascotte2 ───────────────────────────────────────────────
  | 'pensive'         // pensif, main au menton
  // ── Sheet mascotte4 ───────────────────────────────────────────────
  | 'squat'           // squat profond
  | 'deadlift'        // soulevé de terre
  | 'bench_press'     // développé couché sur banc
  // ── Sheet mascotte5 ───────────────────────────────────────────────
  | 'laugh'           // rigole, assis
  | 'pushup'          // pompes
  | 'jumprope'        // corde à sauter
  | 'run'             // court avec lunettes
  | 'flex_v2'         // flex / célébration (nouveau sheet)
  | 'chocolate'       // mange du chocolat
  // ── Sheet mimi 1630×965 ──────────────────────────────────────────
  | 'mimi_goal'       // objectif (goal)
  | 'mimi_level'      // niveau (level)
  // ── Sheet mascotte-mimi2 1376×768 ───────────────────────────────
  | 'mimi2_name'      // prénom
  | 'mimi2_bench'     // développé couché
  | 'mimi2_squat'     // squat
  | 'mimi2_frequency' // fréquence
  // ── Sheet mascotte-mimi3 1376×768 ───────────────────────────────
  | 'mimi3_deadlift'  // soulevé de terre
  | 'mimi3_done';     // célébration finale

export const POSES: Record<MascotPose, PoseDef> = {
  // ── Sheet ancien 1408×768 ─────────────────────────────────────────
  rack:        { x: 10,   y: 10,  w: 300, h: 250, imgW: 1408, imgH: 768, src: SHEET_OLD },
  bench_curl:  { x: 360,  y: 10,  w: 300, h: 250, imgW: 1408, imgH: 768, src: SHEET_OLD },
  lecture:     { x: 715,  y: 10,  w: 230, h: 250, imgW: 1408, imgH: 768, src: SHEET_OLD },
  overhead:    { x: 1000, y: 10,  w: 380, h: 250, imgW: 1408, imgH: 768, src: SHEET_OLD },
  flex:        { x: 50,   y: 274, w: 247, h: 249, imgW: 1408, imgH: 768, src: SHEET_OLD },
  serviette:   { x: 390,  y: 277, w: 320, h: 256, imgW: 1408, imgH: 768, src: SHEET_OLD },
  shaker:      { x: 769,  y: 277, w: 217, h: 256, imgW: 1408, imgH: 768, src: SHEET_OLD },
  shy:         { x: 1143, y: 277, w: 194, h: 256, imgW: 1408, imgH: 768, src: SHEET_OLD },
  halteres:    { x: 10,   y: 540, w: 310, h: 220, imgW: 1408, imgH: 768, src: SHEET_OLD },
  sac:         { x: 370,  y: 540, w: 310, h: 220, imgW: 1408, imgH: 768, src: SHEET_OLD },
  casque:      { x: 730,  y: 540, w: 310, h: 220, imgW: 1408, imgH: 768, src: SHEET_OLD },
  repos:       { x: 1060, y: 540, w: 330, h: 220, imgW: 1408, imgH: 768, src: SHEET_OLD },

  // ── Sheet mascotte3 1376×768 ──────────────────────────────────────
  wave:        { x: 1058, y: 374, w: 300, h: 394, imgW: 1376, imgH: 768, src: SHEET_3 },
  celebrate:   { x: 31,   y: 19,  w: 283, h: 310, imgW: 1376, imgH: 768, src: SHEET_3 },

  // ── Sheet mascotte2 1376×768 ──────────────────────────────────────
  pensive:     { x: 770,  y: 19,  w: 206, h: 254, imgW: 1376, imgH: 768, src: SHEET_2 },

  // ── Sheet mascotte4 1376×768 ──────────────────────────────────────
  squat:       { x: 359,  y: 9,   w: 346, h: 268, imgW: 1376, imgH: 768, src: SHEET_4 },
  deadlift:    { x: 4,    y: 277, w: 350, h: 250, imgW: 1376, imgH: 768, src: SHEET_4 },
  bench_press: { x: 1040, y: 49,  w: 324, h: 212, imgW: 1376, imgH: 768, src: SHEET_4 },

  // ── Sheet mascotte5 1376×768 ──────────────────────────────────────
  laugh:       { x: 778,  y: 18,  w: 232, h: 249, imgW: 1376, imgH: 768, src: SHEET_5 },
  pushup:      { x: 56,   y: 304, w: 271, h: 214, imgW: 1376, imgH: 768, src: SHEET_5 },
  jumprope:    { x: 431,  y: 283, w: 209, h: 292, imgW: 1376, imgH: 768, src: SHEET_5 },
  run:         { x: 1115, y: 18,  w: 209, h: 275, imgW: 1376, imgH: 768, src: SHEET_5 },
  flex_v2:     { x: 56,   y: 18,  w: 235, h: 288, imgW: 1376, imgH: 768, src: SHEET_5 },
  chocolate:   { x: 785,  y: 289, w: 191, h: 242, imgW: 1376, imgH: 768, src: SHEET_5 },

  // ── Sheet mimi 1630×965 ───────────────────────────────────────────
  mimi_goal:   { x: 459, y: 90,  w: 285, h: 320, imgW: 1630, imgH: 965, src: SHEET_MIMI },
  mimi_level:  { x: 844, y: 492, w: 284, h: 357, imgW: 1630, imgH: 965, src: SHEET_MIMI },

  // ── Sheet mascotte-mimi2 1369×1149 ────────────────────────────────
  mimi2_name:      { x: 92,   y: 76,  w: 212, h: 286, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_bench:     { x: 44,   y: 452, w: 307, h: 258, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_squat:     { x: 694,  y: 456, w: 301, h: 238, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },
  mimi2_frequency: { x: 1042, y: 485, w: 251, h: 210, imgW: 1369, imgH: 1149, src: SHEET_MIMI2 },

  // ── Sheet mascotte-mimi3 1536×1024 ────────────────────────────────
  mimi3_deadlift: { x: 429, y: 394, w: 321, h: 277, imgW: 1536, imgH: 1024, src: SHEET_MIMI3 },
  mimi3_done:     { x: 429, y: 47,  w: 321, h: 312, imgW: 1536, imgH: 1024, src: SHEET_MIMI3 },
};

// ── Props ─────────────────────────────────────────────────────────
interface MascotProps {
  pose: MascotPose;
  /** Hauteur d'affichage — largeur calculée proportionnellement */
  height?: number;
  /** Animation d'apparition (fade + slide-up) */
  animate?: boolean;
  /** Léger flottement permanent (idle) */
  float?: boolean;
}

// ── Composant ─────────────────────────────────────────────────────
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
