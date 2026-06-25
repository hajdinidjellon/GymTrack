/**
 * ÉCRAN DE TEST TEMPORAIRE — galerie HudFrame.
 *  - 3 shapes × 3 intensities
 *  - mode DEBUG d'isolation de couche (base + premium)
 *  - toggle premium + comparaison side-by-side
 * À SUPPRIMER après validation visuelle.
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import {
  HudFrame,
  type HudFrameShape,
  type HudFrameIntensity,
  type HudFrameLayer,
  type PremiumIntensity,
} from '@/components/ui/hud';
import { hud } from '@/constants/theme';

const SHAPES: HudFrameShape[] = ['octagon', 'rounded-rect', 'arrow-right'];
const INTENSITIES: HudFrameIntensity[] = ['low', 'medium', 'high'];
const BASE_LAYERS: HudFrameLayer[] = ['halo', 'mid', 'bg', 'border', 'inner', 'highlight', 'indicators'];
// Couches premium implémentées (ajoutées une à une). Numérotation = spec.
const PREMIUM_INTENSITIES: PremiumIntensity[] = ['subtle', 'medium', 'strong'];
const PREMIUM_LAYERS: { layer: HudFrameLayer; num: number }[] = [
  { layer: 'noise', num: 8 },
  { layer: 'asymHalo', num: 9 },
  { layer: 'colorVar', num: 10 },
  { layer: 'vignette', num: 11 },
  { layer: 'leaks', num: 12 },
  { layer: 'edgeBloom', num: 13 },
  { layer: 'scanlines', num: 14 },
  { layer: 'chroma', num: 15 },
];

function Label({ children }: { children: string }) {
  return (
    <Text style={{ color: hud.cyan.bright, fontFamily: 'Rajdhani-Bold', fontSize: 11, letterSpacing: 1, marginBottom: 14, marginTop: 22 }}>
      {children}
    </Text>
  );
}

function Body({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: hud.text.primary, fontFamily: 'Rajdhani-Bold', fontSize: 13, letterSpacing: 1, textAlign: 'center' }}>
        {title}
      </Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: active ? hud.cyan.bright : 'rgba(93,222,255,0.25)',
        backgroundColor: active ? 'rgba(29,196,255,0.18)' : 'transparent',
        borderRadius: 4,
      }}
    >
      <Text style={{ color: active ? hud.cyan.bright : hud.text.secondary, fontFamily: 'Rajdhani-Bold', fontSize: 12, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HudTest() {
  const [debug, setDebug] = useState<HudFrameLayer | undefined>(undefined);
  const [premium, setPremium] = useState(false);
  const [pIntensity, setPIntensity] = useState<PremiumIntensity>('medium');

  // Sélectionner une couche premium force l'affichage premium.
  const selectLayer = (l: HudFrameLayer) => {
    setDebug(l);
    if (PREMIUM_LAYERS.some((p) => p.layer === l)) setPremium(true);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: hud.bg.app }}
      contentContainerStyle={{ padding: 32, paddingTop: 64, gap: 8 }}
    >
      <Text style={{ color: hud.text.primary, fontFamily: 'Rajdhani-Bold', fontSize: 20, letterSpacing: 1 }}>
        HudFrame — galerie de test
      </Text>

      {/* ── TOGGLE PREMIUM ─────────────────────────────────────────── */}
      <Label>PREMIUM (couches « painted »)</Label>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="premium OFF" active={!premium} onPress={() => setPremium(false)} />
        <Chip label="premium ON" active={premium} onPress={() => setPremium(true)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {PREMIUM_INTENSITIES.map((pi) => (
          <Chip key={pi} label={pi} active={pIntensity === pi} onPress={() => setPIntensity(pi)} />
        ))}
      </View>

      {/* ── DEBUG : isolation de couche ────────────────────────────── */}
      <Label>DEBUG — ISOLER UNE COUCHE</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="ALL" active={debug === undefined} onPress={() => setDebug(undefined)} />
        {BASE_LAYERS.map((l, i) => (
          <Chip key={l} label={`${i + 1}·${l}`} active={debug === l} onPress={() => selectLayer(l)} />
        ))}
        {PREMIUM_LAYERS.map(({ layer, num }) => (
          <Chip key={layer} label={`${num}·${layer}`} active={debug === layer} onPress={() => selectLayer(layer)} />
        ))}
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
        <HudFrame width={280} height={150} shape="octagon" intensity="high" bevel={hud.cut.lg} premium={premium} premiumIntensity={pIntensity} debugOnly={debug}>
          <Body title={debug ? `DEBUG: ${debug}` : premium ? `ALL + PREMIUM (${pIntensity})` : 'BASE (7)'} />
        </HudFrame>
      </View>

      {/* ── SIDE BY SIDE : base vs premium ─────────────────────────── */}
      <Label>SIDE BY SIDE — base ◀ ▶ premium</Label>
      <View style={{ flexDirection: 'row', gap: 36, paddingVertical: 16, justifyContent: 'center' }}>
        <HudFrame width={130} height={130} shape="octagon" intensity="high" premium={false}>
          <Body title="BASE" />
        </HudFrame>
        <HudFrame width={130} height={130} shape="octagon" intensity="high" premium premiumIntensity={pIntensity}>
          <Body title={`PREMIUM\n${pIntensity}`} />
        </HudFrame>
      </View>

      {/* ── 3 shapes × 3 intensities (suit le toggle premium) ──────── */}
      {SHAPES.map((shape) => (
        <View key={shape}>
          <Label>{shape.toUpperCase()}</Label>
          <View style={{ gap: 40 }}>
            {INTENSITIES.map((intensity) => (
              <HudFrame
                key={intensity}
                width={260}
                height={shape === 'arrow-right' ? 56 : 80}
                shape={shape}
                intensity={intensity}
                premium={premium}
                premiumIntensity={pIntensity}
              >
                <Body title={`${shape} · ${intensity}`} />
              </HudFrame>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
