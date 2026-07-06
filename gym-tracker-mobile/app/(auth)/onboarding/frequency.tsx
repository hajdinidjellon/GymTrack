import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { SegmentedHud, OctoIcon } from '@/components/ui/hud';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud, hudType } from '@/constants/theme';
import type { OnboardingGoal } from '@/types';

const NEXT_AFTER_FREQUENCY: Record<OnboardingGoal, string> = {
  pr:          '/(auth)/onboarding/bench',
  hypertrophy: '/(auth)/onboarding/muscle-focus',
  weight_loss: '/(auth)/onboarding/current-weight',
  consistency: '/(auth)/onboarding/preferred-days',
  health:      '/(auth)/onboarding/health-focus',
};

const FREQS = [1, 2, 3, 4, 5, 6, 7] as const;

const ADVICE: Record<number, string> = {
  1: 'Un bon début — mieux vaut une séance tenue que zéro.',
  2: 'Parfait pour démarrer ou maintenir sa condition physique.',
  3: 'Le compromis idéal pour progresser sans s\'épuiser.',
  4: 'Un volume solide — assure-toi de bien récupérer.',
  5: 'Entraînement intensif — dédié aux passionnés.',
  6: 'Haut volume — réservé aux athlètes aguerris.',
  7: 'Tous les jours — écoute bien ton corps et priorise la récupération.',
};

/** Accent du conseil selon la charge : régulier → regen, standard → cyan, haut volume → warn. */
const TONE: Record<number, string> = {
  1: hud.cyan.primary,
  2: hud.accent.regen,
  3: hud.accent.regen,
  4: hud.cyan.primary,
  5: hud.cyan.primary,
  6: hud.accent.warn,
  7: hud.accent.warn,
};

export default function OnboardingFrequencyScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string }>();
  const goal   = parseGoal(params.goal);
  const total  = getTotalSteps(goal);
  const [freq, setFreq] = useState(3);
  const tone = TONE[freq] ?? hud.cyan.primary;

  return (
    <OnboardingFrame
      question="Combien de séances par semaine ?"
      subtext="Mieux vaut 3 séances tenues que 6 abandonnées."
      step={4}
      total={total}
      canContinue={true}
      onContinue={() =>
        router.push({
          pathname: NEXT_AFTER_FREQUENCY[goal] as never,
          params: { ...params, frequency: String(freq) },
        })
      }
    >
      {/* Sélecteur segmenté HUD */}
      <SegmentedHud
        options={FREQS.map((n) => String(n))}
        selectedIndex={freq - 1}
        onChange={(i) => setFreq(FREQS[i] ?? 3)}
        height={46}
      />
      <Text style={{ ...hudType.labelHud, textAlign: 'center', marginTop: 2 }}>
        Séances / semaine
      </Text>

      {/* Conseil */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: hud.bg.surfaceDeep,
        borderWidth: 1, borderColor: `${tone}28`,
        borderRadius: 10, padding: 14, marginTop: 8,
      }}>
        <OctoIcon size={36} level="g0" borderColor={tone}>
          <Ionicons name="bulb-outline" size={17} color={tone} />
        </OctoIcon>
        <Text style={{
          flex: 1,
          fontFamily: 'Rajdhani-SemiBold', fontSize: 15, lineHeight: 20,
          color: hud.text.primary, letterSpacing: 0.2,
        }}>
          {ADVICE[freq]}
        </Text>
      </View>
    </OnboardingFrame>
  );
}
