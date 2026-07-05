import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudCard } from '@/components/ui/hud/HudCard';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud } from '@/constants/theme';
import type { OnboardingGoal } from '@/types';

const NEXT_AFTER_FREQUENCY: Record<OnboardingGoal, string> = {
  pr:          '/(auth)/onboarding/bench',
  hypertrophy: '/(auth)/onboarding/muscle-focus',
  weight_loss: '/(auth)/onboarding/current-weight',
  consistency: '/(auth)/onboarding/preferred-days',
  health:      '/(auth)/onboarding/health-focus',
};

const OPTS: Array<{ n: number; color: string }> = [
  { n: 1, color: '#94a3b8' },
  { n: 2, color: '#34d399' },
  { n: 3, color: '#38bdf8' },
  { n: 4, color: '#a78bfa' },
  { n: 5, color: '#f59e0b' },
  { n: 6, color: '#f87171' },
  { n: 7, color: '#ef4444' },
];

const ADVICE: Record<number, string> = {
  1: 'Un bon début — mieux vaut une séance tenue que zéro.',
  2: 'Parfait pour démarrer ou maintenir sa condition physique.',
  3: 'Le compromis idéal pour progresser sans s\'épuiser.',
  4: 'Un volume solide — assure-toi de bien récupérer.',
  5: 'Entraînement intensif — dédié aux passionnés.',
  6: 'Haut volume — réservé aux athlètes aguerris.',
  7: 'Tous les jours — écoute bien ton corps et priorise la récupération.',
};

export default function OnboardingFrequencyScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string }>();
  const goal   = parseGoal(params.goal);
  const total  = getTotalSteps(goal);
  const [freq, setFreq] = useState(3);
  const opt = OPTS.find((o) => o.n === freq) ?? OPTS[2]!;

  const select = (n: number) => {
    Haptics.selectionAsync().catch(() => null);
    setFreq(n);
  };

  return (
    <OnboardingFrame
      question="Combien de séances par semaine ?"
      subtext="Mieux vaut 3 séances tenues que 6 abandonnées."
      mood="listening"
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
      {/* Grille 4 + 3 */}
      <View style={{ gap: 8 }}>
        {/* Ligne 1 : 1, 2, 3, 4 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTS.slice(0, 4).map((o) => (
            <FreqTile key={o.n} opt={o} selected={freq === o.n} onPress={() => select(o.n)} />
          ))}
        </View>
        {/* Ligne 2 : 5, 6, 7 + spacer invisible */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTS.slice(4).map((o) => (
            <FreqTile key={o.n} opt={o} selected={freq === o.n} onPress={() => select(o.n)} />
          ))}
          {/* Spacer pour conserver la largeur des tiles identique à la ligne 1 */}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Conseil */}
      <HudCard level="g0" cut={hud.cut.sm} borderColor={`${opt.color}45`} padding={14}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Ionicons name="bulb-outline" size={18} color={opt.color} style={{ marginTop: 1 }} />
          <Text style={{
            flex: 1,
            fontFamily: 'Rajdhani-SemiBold',
            fontSize: 15, lineHeight: 20,
            color: hud.text.primary,
          }}>
            {ADVICE[freq]}
          </Text>
        </View>
      </HudCard>
    </OnboardingFrame>
  );
}

function FreqTile({ opt, selected, onPress }: {
  opt: typeof OPTS[number]; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <HudCard
        level={selected ? 'g2' : 'g0'}
        cut={hud.cut.sm}
        borderColor={selected ? opt.color : undefined}
        glowColor={selected ? `${opt.color}4D` : undefined}
        padding={0}
      >
        <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
            <Text style={{
              fontFamily: 'Rajdhani-Bold',
              fontSize: 26, lineHeight: 30,
              fontVariant: ['tabular-nums'],
              color: selected ? opt.color : hud.text.muted,
            }}>
              {opt.n}
            </Text>
            <Text style={{
              fontFamily: 'Rajdhani-Bold',
              fontSize: 15, lineHeight: 22,
              color: selected ? opt.color : hud.text.faint,
            }}>
              ×
            </Text>
          </View>
        </View>
      </HudCard>
    </Pressable>
  );
}
