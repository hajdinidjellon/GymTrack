import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

const OPTS: Array<{ n: number; label: string; hint: string; color: string }> = [
  { n: 0, label: '0',  hint: 'Aucun',     color: '#94a3b8' },
  { n: 1, label: '1',  hint: 'Par sem.',  color: '#60a5fa' },
  { n: 2, label: '2',  hint: 'Par sem.',  color: '#34d399' },
  { n: 3, label: '3',  hint: 'Par sem.',  color: '#fbbf24' },
  { n: 4, label: '4',  hint: 'Par sem.',  color: '#f59e0b' },
  { n: 5, label: '5+', hint: 'Par sem.',  color: '#f87171' },
];

const ADVICE: Record<number, string> = {
  0: 'OK — la muscu seule peut suffire si ta nutrition suit.',
  1: 'Un peu de cardio par semaine, parfait en complément.',
  2: 'Bon équilibre — cardio léger + muscu, recette gagnante.',
  3: 'Approche solide — la combinaison la plus efficace pour la perte de gras.',
  4: 'Volume élevé — assure-toi de bien manger pour récupérer.',
  5: 'Très intense — alterne haute/basse intensité et écoute ton corps.',
};

export default function OnboardingCardioScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    weight: string; height: string; targetWeight: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [n, setN] = useState(2);
  const opt = OPTS.find((o) => o.n === n) ?? OPTS[2]!;

  return (
    <OnboardingFrame
      pose="mimi_cardio"
      mascotHeight={170}
      question="Combien de cardio par semaine ?"
      subtext="Course, vélo, corde à sauter, marche rapide…"
      step={7}
      total={total}
      canContinue={true}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/done',
        params: { ...params, cardioPerWeek: String(n) },
      })}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {OPTS.map((o) => (
          <Pressable
            key={o.n}
            onPress={() => setN(o.n)}
            style={({ pressed }) => ({
              width: '31%',
              paddingVertical: 20,
              borderRadius: 18,
              backgroundColor: n === o.n ? `${o.color}22` : 'rgba(255,255,255,0.04)',
              borderWidth: 2,
              borderColor: n === o.n ? o.color : 'rgba(255,255,255,0.09)',
              alignItems: 'center', gap: 4,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Text style={{
              fontSize: 28, fontWeight: '900',
              color: n === o.n ? o.color : 'rgba(255,255,255,0.55)',
              letterSpacing: -1,
            }}>
              {o.label}
            </Text>
            <Text style={{
              fontSize: 10, fontWeight: '700',
              color: n === o.n ? `${o.color}CC` : 'rgba(255,255,255,0.28)',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              {o.hint}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: `${opt.color}12`,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: `${opt.color}28`,
        marginTop: 8,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: `${opt.color}22`, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          <Ionicons name="bulb-outline" size={18} color={opt.color} />
        </View>
        <Text style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: '600', lineHeight: 20 }}>
          {ADVICE[n]}
        </Text>
      </View>
    </OnboardingFrame>
  );
}
