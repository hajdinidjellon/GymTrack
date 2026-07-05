/**
 * ONBOARDING FRAME — cadre commun des écrans de calibration (DA HUD ATLAS).
 * Même langage que le planner/accueil : fond session, octogones, Rajdhani,
 * ProgressRail segmenté, CTA BevelButton. NEXUS pose la question en
 * typewriter (MOBILE_PREMIUM.md §2) et réagit via la prop `mood`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Canvas, Path as SkPath } from '@shopify/react-native-skia';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NexusOrb, type NexusMood } from '@/components/mascot/NexusOrb';
import { TypewriterText } from '@/components/mascot/TypewriterText';
import { BevelButton } from '@/components/ui/hud/BevelButton';
import { ProgressRail } from '@/components/ui/hud/ProgressRail';
import { octagonPath } from '@/components/ui/hud/octagon';
import { hud, hudType } from '@/constants/theme';

const SESSION_BG = require('@/assets/images/background-session.png') as number;

// ── Barre de progression « calibration » ──────────────────────────
// Rail segmenté HUD : 1 segment = 1 étape (DESIGN-GYMTRACK.md §B.3).
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ gap: 6 }}>
      <ProgressRail progress={current / total} segments={total} height={5} />
      <Text style={[hudType.labelHud, { fontSize: 11, color: hud.text.muted }]}>
        Calibration {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </Text>
    </View>
  );
}

// ── Bouton retour octogonal ───────────────────────────────────────
const BACK_SIZE = 40;

function OctoBackButton() {
  const path = useMemo(
    () => octagonPath(0.75, 0.75, BACK_SIZE - 1.5, BACK_SIZE - 1.5, hud.cut.sm),
    [],
  );
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      style={({ pressed }) => ({
        width: BACK_SIZE, height: BACK_SIZE,
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Canvas
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, width: BACK_SIZE, height: BACK_SIZE }}
      >
        <SkPath path={path} color={hud.bg.surface} style="fill" opacity={0.85} />
        <SkPath path={path} color={hud.border.subtle} style="stroke" strokeWidth={1} />
      </Canvas>
      <Ionicons name="chevron-back" size={20} color={hud.cyan.bright} />
    </Pressable>
  );
}

// ── Props ─────────────────────────────────────────────────────────
interface OnboardingFrameProps {
  question: string;
  subtext?: string;
  step: number;
  total: number;
  canContinue: boolean;
  /** État émotionnel de NEXUS une fois la question posée (défaut : idle). */
  mood?: NexusMood;
  /** Taille de l'orbe (défaut 88 ; réduire sur les écrans à clavier). */
  nexusSize?: number;
  ctaLabel?: string;
  skipLabel?: string;
  onSkip?: () => void;
  onContinue?: () => void;
  /** Contenu affiché juste au-dessus du bouton Continuer */
  aboveCta?: React.ReactNode;
  /** Cache le bouton CTA — utiliser quand la navigation est déclenchée par la sélection */
  hideCta?: boolean;
  loading?: boolean;
  hideBack?: boolean;
  children: React.ReactNode;
}

export function OnboardingFrame({
  question, subtext,
  step, total, canContinue,
  mood = 'idle', nexusSize = 88,
  ctaLabel = 'Continuer',
  skipLabel, onSkip, onContinue, aboveCta, hideCta = false, loading = false, hideBack = false,
  children,
}: OnboardingFrameProps) {
  // NEXUS parle pendant que la question s'écrit, puis reprend son mood
  const [typing, setTyping] = useState(true);
  useEffect(() => setTyping(true), [question]);
  const activeMood: NexusMood = typing ? 'talking' : mood;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: hud.bg.app }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fond partagé avec la séance / le planner */}
      <ImageBackground
        source={SESSION_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.55 }}
      />
      <LinearGradient
        colors={['rgba(5,11,22,0.30)', 'rgba(5,11,22,0.55)', 'rgba(5,11,22,0.92)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 16,
          paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
        }}>
          {!hideBack ? <OctoBackButton /> : <View style={{ width: BACK_SIZE }} />}
          <View style={{ flex: 1 }}>
            <StepProgress current={step} total={total} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── NEXUS ───────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 18 }}>
            <NexusOrb size={nexusSize} mood={activeMood} />
          </View>

          {/* ── Question (typewriter, skippable) ────────── */}
          <View style={{ marginBottom: 24, minHeight: 68 }}>
            <TypewriterText
              text={question}
              onDone={() => setTyping(false)}
              style={{
                fontFamily: 'Rajdhani-Bold',
                fontSize: 27,
                lineHeight: 34,
                letterSpacing: 0.3,
                color: hud.text.primary,
              }}
            />
            {subtext ? (
              <Text style={[hudType.body, { marginTop: 8 }]}>
                {subtext}
              </Text>
            ) : null}
          </View>

          {/* ── Contenu (choices / input) ───────────────── */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(320)}
            style={{ gap: 10 }}
          >
            {children}
          </Animated.View>
        </ScrollView>

        {/* ── Footer ──────────────────────────────────── */}
        {(!hideCta || (skipLabel && onSkip)) && (
          <View style={{
            paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 8,
          }}>
            {aboveCta}
            {skipLabel && onSkip && (
              <Pressable
                onPress={onSkip}
                style={({ pressed }) => ({
                  alignItems: 'center', paddingVertical: 10,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Text style={[hudType.labelHud, { color: hud.text.muted }]}>
                  {skipLabel}
                </Text>
              </Pressable>
            )}

            {!hideCta && onContinue && (
              <BevelButton
                label={ctaLabel}
                onPress={onContinue}
                disabled={!canContinue}
                loading={loading}
                heroChevrons
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
