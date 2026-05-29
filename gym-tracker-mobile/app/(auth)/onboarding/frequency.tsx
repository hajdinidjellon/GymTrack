import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
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

  return (
    <OnboardingFrame
      pose="mimi2_frequency"
      mascotHeight={120}
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
      {/* Grille 4 + 3 */}
      <View style={{ gap: 8 }}>
        {/* Ligne 1 : 1, 2, 3, 4 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTS.slice(0, 4).map((o) => (
            <FreqTile key={o.n} opt={o} selected={freq === o.n} onPress={() => setFreq(o.n)} />
          ))}
        </View>
        {/* Ligne 2 : 5, 6, 7 + spacer invisible */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTS.slice(4).map((o) => (
            <FreqTile key={o.n} opt={o} selected={freq === o.n} onPress={() => setFreq(o.n)} />
          ))}
          {/* Spacer pour conserver la largeur des tiles identique à la ligne 1 */}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Conseil */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: `${opt.color}12`,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: `${opt.color}28`,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: `${opt.color}22`,
          alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}>
          <Ionicons name="bulb-outline" size={18} color={opt.color} />
        </View>
        <Text style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: '600', lineHeight: 20 }}>
          {ADVICE[freq]}
        </Text>
      </View>
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
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: selected ? opt.color : 'rgba(255,255,255,0.12)',
        transform: [{ scale: pressed ? 0.94 : 1 }],
        shadowColor: selected ? opt.color : 'transparent',
        shadowOpacity: selected ? 0.60 : 0,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: selected ? 10 : 0,
      })}
    >
      <View style={{ backgroundColor: 'rgba(8,10,20,0.88)', overflow: 'hidden', borderRadius: 16 }}>
        {selected && (
          <LinearGradient
            colors={[`${opt.color}55`, `${opt.color}22`, `${opt.color}08`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        {selected && (
          <LinearGradient
            colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%' }}
          />
        )}
        <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
            <Text style={{
              fontSize: 26, fontWeight: '900',
              color: selected ? opt.color : 'rgba(255,255,255,0.45)',
              letterSpacing: -1, lineHeight: 30,
            }}>
              {opt.n}
            </Text>
            <Text style={{
              fontSize: 15, fontWeight: '800',
              color: selected ? opt.color : 'rgba(255,255,255,0.30)',
              lineHeight: 22,
            }}>
              ×
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
