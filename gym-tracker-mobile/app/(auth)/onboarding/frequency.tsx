import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';

const { width: W } = Dimensions.get('window');
const TOTAL = 8;

const OPTS: Array<{ n: number; label: string; hint: string; color: string }> = [
  { n: 2, label: '2×',  hint: 'Par semaine',  color: '#34d399' },
  { n: 3, label: '3×',  hint: 'Par semaine',  color: '#38bdf8' },
  { n: 4, label: '4×',  hint: 'Par semaine',  color: '#a78bfa' },
  { n: 5, label: '5×',  hint: 'Par semaine',  color: '#f59e0b' },
  { n: 6, label: '6×',  hint: 'Par semaine',  color: '#f87171' },
];

const ADVICE: Record<number, string> = {
  2: 'Parfait pour démarrer ou maintenir sa condition physique.',
  3: 'Le compromis idéal pour progresser sans s\'épuiser.',
  4: 'Un volume solide — assure-toi de bien récupérer.',
  5: 'Entraînement intensif — dédiés aux passionnés.',
  6: 'Haut volume — réservé aux athlètes aguerris.',
};

export default function OnboardingFrequencyScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string }>();
  const [freq, setFreq] = useState(3);
  const opt  = OPTS.find((o) => o.n === freq) ?? OPTS[1]!;

  return (
    <OnboardingFrame
      pose="sac"
      mascotHeight={160}
      question="Combien de séances par semaine ?"
      subtext="Mieux vaut 3 séances tenues que 6 abandonnées."
      step={4}
      total={TOTAL}
      canContinue={true}
      onContinue={() =>
        router.push({
          pathname: '/(auth)/onboarding/bench',
          params: { ...params, frequency: String(freq) },
        })
      }
    >
      {/* Grille 2+3 */}
      <View style={{ gap: 12 }}>
        {/* Ligne 1 : 2 et 3 */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {OPTS.slice(0, 2).map((o) => <FreqCard key={o.n} opt={o} selected={freq === o.n} onPress={() => setFreq(o.n)} />)}
        </View>
        {/* Ligne 2 : 4, 5, 6 */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {OPTS.slice(2).map((o) => <FreqCard key={o.n} opt={o} selected={freq === o.n} onPress={() => setFreq(o.n)} />)}
        </View>
      </View>

      {/* Description */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: `${opt.color}12`,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: `${opt.color}28`,
        marginTop: 4,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: `${opt.color}22`, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          <Ionicons name="bulb-outline" size={18} color={opt.color} />
        </View>
        <Text style={{ flex: 1, fontSize: 15, color: '#fff', fontWeight: '600', lineHeight: 21 }}>
          {ADVICE[freq]}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

function FreqCard({ opt, selected, onPress }: {
  opt: typeof OPTS[number]; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 22, paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: selected ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
        borderWidth: 2,
        borderColor: selected ? opt.color : 'rgba(255,255,255,0.09)',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <Text style={{
        fontSize: 36, fontWeight: '900',
        color: selected ? opt.color : 'rgba(255,255,255,0.55)',
        letterSpacing: -1,
      }}>
        {opt.label}
      </Text>
      <Text style={{
        fontSize: 11, fontWeight: '700',
        color: selected ? `${opt.color}CC` : 'rgba(255,255,255,0.28)',
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {opt.hint}
      </Text>
    </Pressable>
  );
}
