/**
 * REST TIMER (overlay) — DA HUD sci-fi.
 *
 * Overlay compact centré sur le PNG `timer-background.png` (ratio 960×1140).
 * Le chrono est posé au centre de l'anneau HUD du PNG. La carte exercice
 * reste visible derrière un scrim dim (rgba(0,0,0,0.75)). Sous l'anneau :
 * une rangée minimale de contrôles (−15s, +15s, SKIP).
 */
import React from 'react';
import { View, Text, Pressable, Modal, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { DA, OctagonShape } from './SessionDashboard';
import { PremiumFrame } from '@/components/ui/PremiumFrame';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  Skia,
  LinearGradient as SkLinearGradient,
  vec,
} from '@shopify/react-native-skia';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isVisible: boolean;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
  // Props infos exo/série conservées pour usage futur, ignorées dans
  // cette variante minimaliste (l'overlay n'affiche que l'anneau + chrono).
  exerciseName?: string;
  setNumber?: number;
  setsTotal?: number;
  lastWeight?: number;
  lastReps?: number;
}

const TIMER_BG = require('@/assets/images/timer-background.png') as number;

// Ratio natif du PNG (960 × 1140) — préservé sur le container
const PNG_RATIO = 1140 / 960; // ≈ 1.1875

function formatTime(s: number): string {
  const m   = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Bouton de contrôle (−15s, +15s) — PremiumFrame neutral subtle ────
function ControlButton({ label, w, h, onPress }: { label: string; w: number; h: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: w, height: h,
        position: 'relative',
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <PremiumFrame
          width={w} height={h}
          variant="neutral" cornerCut={12} intensity="subtle"
          showCornerAccents={false} contentPadding={0}
        />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '600', color: DA.white, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Bouton SKIP (octogone Skia : glow bleu + gradient violet→bleu) ────
// On garde l'identité visuelle violet→bleu mais on remplace
// shadowOpacity/elevation par un glow Skia BlurMask (conforme à la
// règle "no native shadow").
function SkipButton({ w, h, onPress }: { w: number; h: number; onPress: () => void }) {
  const HALO = 24;
  const cw = w + HALO * 2;
  const ch = h + HALO * 2;
  const bevel = 12;
  const path = React.useMemo(
    () => Skia.Path.MakeFromSVGString(
      `M ${HALO + bevel} ${HALO} L ${HALO + w - bevel} ${HALO} L ${HALO + w} ${HALO + bevel} L ${HALO + w} ${HALO + h - bevel} L ${HALO + w - bevel} ${HALO + h} L ${HALO + bevel} ${HALO + h} L ${HALO} ${HALO + h - bevel} L ${HALO} ${HALO + bevel} Z`,
    )!,
    [w, h],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: w, height: h,
        position: 'relative',
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Canvas
        style={{
          position: 'absolute',
          top: -HALO, left: -HALO,
          width: cw, height: ch,
        }}
      >
        {/* Glow bleu (Skia BlurMask, remplace shadowOpacity/elevation) */}
        <SkPath path={path} color="#3B82F6" opacity={0.55} style="fill">
          <BlurMask blur={20} style="normal" />
        </SkPath>
        {/* Fill gradient violet → bleu */}
        <SkPath path={path} style="fill">
          <SkLinearGradient
            start={vec(HALO, HALO)}
            end={vec(HALO + w, HALO + h)}
            colors={['#6366F1', '#3B82F6']}
          />
        </SkPath>
        {/* Filet lumineux haut (bevel) */}
        <SkPath
          path={Skia.Path.MakeFromSVGString(
            `M ${HALO} ${HALO + bevel} L ${HALO + bevel} ${HALO} L ${HALO + w - bevel} ${HALO} L ${HALO + w} ${HALO + bevel}`,
          )!}
          color="#A5B4FC"
          opacity={0.6}
          style="stroke"
          strokeWidth={1.2}
        />
      </Canvas>
      <Text style={{
        fontSize: 17, fontWeight: '700', color: DA.white,
        letterSpacing: 1.4, textTransform: 'uppercase',
      }}>
        SKIP
      </Text>
    </Pressable>
  );
}

// ── Composant principal ──────────────────────────────────────────────
export function RestTimer({
  secondsLeft, totalSeconds, isVisible, onSkip, onAddTime,
}: RestTimerProps) {
  const { width: sw, height: shh } = useWindowDimensions();

  // Dimensions de l'anneau : on prend ~92% de la largeur écran, et on
  // limite la hauteur à 70% de l'écran pour garder de la place aux contrôles.
  const maxW       = Math.min(sw * 0.92, 420);
  const heightFromW = maxW * PNG_RATIO;
  const maxH       = shh * 0.70;
  const ringW      = heightFromW > maxH ? maxH / PNG_RATIO : maxW;
  const ringH      = ringW * PNG_RATIO;

  const timeStr  = formatTime(secondsLeft);
  const totalStr = formatTime(totalSeconds);

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      {/* Scrim : tap dehors = skip */}
      <Pressable
        onPress={onSkip}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Carte centrale = anneau PNG seul, contrôles posés DEDANS en absolute.
            Pressable autour pour absorber les taps sur la zone chrono (sans
            skip), tout en laissant les boutons enfants gérer leur tap. */}
        <Pressable onPress={() => null}>
          {(() => {
            // Boutons en ratio 2:1, écartés équitablement via space-between.
            // Position absolute dans le PNG, au-dessus de la zone du chrono.
            const btnH = Math.round(ringW * 0.135);  // ≈ 49 pour ringW 360
            const btnW = btnH * 2;                    // ≈ 98
            const bottomInset = Math.round(ringH * 0.08); // encore descendu (avant 0.18)
            const sideInset   = Math.round(ringW * 0.065);

            return (
              <View style={{ width: ringW, height: ringH }}>
                {/* PNG anneau HUD */}
                <Image
                  source={TIMER_BG}
                  style={{ position: 'absolute', top: 0, left: 0, width: ringW, height: ringH }}
                  resizeMode="contain"
                />

                {/* Chrono — centré dans l'anneau */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: Math.round(ringW * 0.22),
                      fontWeight: '700',
                      color: DA.cyanBright,
                      letterSpacing: -0.5,
                      fontVariant: ['tabular-nums'],
                      textShadowColor: 'rgba(34,211,238,0.55)',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 14,
                    }}
                  >
                    {timeStr}
                  </Text>
                  <Text style={{
                    fontSize: Math.round(ringW * 0.06),
                    fontWeight: '600',
                    color: DA.cyanPrimary,
                    opacity: 0.75,
                    marginTop: 4,
                    fontVariant: ['tabular-nums'],
                  }}>
                    / {totalStr}
                  </Text>
                </View>

                {/* Contrôles : −15s · +15s · SKIP — posés au-dessus du chrono,
                    écartés régulièrement par justifyContent: space-between. */}
                <View
                  style={{
                    position: 'absolute',
                    left: sideInset, right: sideInset,
                    bottom: bottomInset,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ControlButton w={btnW} h={btnH} label="−15s" onPress={() => onAddTime(-15)} />
                  <ControlButton w={btnW} h={btnH} label="+15s" onPress={() => onAddTime(15)} />
                  <SkipButton    w={btnW} h={btnH} onPress={onSkip} />
                </View>
              </View>
            );
          })()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
