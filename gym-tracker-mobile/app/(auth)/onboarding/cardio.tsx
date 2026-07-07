import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OctoIcon } from '@/components/ui/hud';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud } from '@/constants/theme';

const OPTS: Array<{ n: number; label: string; hint: string; color: string }> = [
  { n: 0, label: '0',  hint: 'Aucun',    color: hud.cyan.dim },
  { n: 1, label: '1',  hint: 'Par sem.', color: hud.cyan.primary },
  { n: 2, label: '2',  hint: 'Par sem.', color: hud.accent.regen },
  { n: 3, label: '3',  hint: 'Par sem.', color: hud.accent.warn },
  { n: 4, label: '4',  hint: 'Par sem.', color: hud.accent.ember },
  { n: 5, label: '5+', hint: 'Par sem.', color: hud.accent.pulse },
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
      question="Combien de cardio par semaine ?"
      subtext="Course, vélo, corde à sauter, marche rapide…"
      step={7}
      total={total}
      canContinue={true}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, cardioPerWeek: String(n) },
      })}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {OPTS.map((o) => {
          const active = n === o.n;
          return (
            <Pressable
              key={o.n}
              onPress={() => {
                Haptics.selectionAsync().catch(() => null);
                setN(o.n);
              }}
              style={({ pressed }) => ({
                width: '31%',
                paddingVertical: 18,
                borderRadius: 10,
                backgroundColor: active ? `${o.color}1A` : hud.bg.surfaceDeep,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? o.color : hud.border.subtle,
                alignItems: 'center', gap: 4,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Text style={{
                fontFamily: 'Rajdhani-Bold', fontSize: 28,
                fontVariant: ['tabular-nums'],
                color: active ? o.color : hud.text.secondary,
                letterSpacing: -1,
              }}>
                {o.label}
              </Text>
              <Text style={{
                fontFamily: 'Rajdhani-Medium', fontSize: 10,
                color: active ? `${o.color}CC` : hud.text.faint,
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}>
                {o.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: hud.bg.surfaceDeep,
        borderWidth: 1, borderColor: `${opt.color}28`,
        borderRadius: 10, padding: 14, marginTop: 8,
      }}>
        <OctoIcon size={36} level="g0" borderColor={opt.color}>
          <Ionicons name="bulb-outline" size={17} color={opt.color} />
        </OctoIcon>
        <Text style={{
          flex: 1,
          fontFamily: 'Rajdhani-SemiBold', fontSize: 15, lineHeight: 20,
          color: hud.text.primary, letterSpacing: 0.2,
        }}>
          {ADVICE[n]}
        </Text>
      </View>
    </OnboardingFrame>
  );
}
