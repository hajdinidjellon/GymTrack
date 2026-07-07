import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  OnboardingFrame, REACTION_NAV_DELAY, type OnboardingReaction,
} from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { hud } from '@/constants/theme';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';

const LEVELS: Array<{
  id: Level;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  reaction: OnboardingReaction;
}> = [
  { id: 'beginner',     icon: 'leaf',    title: 'Débutant',      subtitle: 'Débuter ou reprendre · < 1 an',   color: hud.accent.regen, reaction: { text: 'Les meilleures progressions commencent ici.', mood: 'celebrate' } },
  { id: 'intermediate', icon: 'barbell', title: 'Intermédiaire', subtitle: 'Régulier · 1 – 3 ans',            color: hud.cyan.primary, reaction: { text: 'Base solide. On accélère.' } },
  { id: 'advanced',     icon: 'flash',   title: 'Avancé',        subtitle: 'Solide et structuré · 3 – 5 ans', color: hud.accent.pulse, reaction: { text: 'Données solides. On va affiner.' } },
  { id: 'elite',        icon: 'ribbon',  title: 'Élite',         subtitle: 'Compétiteur · 5 ans+',             color: hud.accent.warn,  reaction: { text: 'Données solides. On va affiner.' } },
];

export default function OnboardingLevelScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<Level | null>(null);
  const [reaction, setReaction] = useState<OnboardingReaction | null>(null);

  const handleSelect = (id: Level) => {
    if (selected) return; // une réponse = un engagement, pas de spam
    setSelected(id);
    const level = LEVELS.find((l) => l.id === id)!;
    setReaction(level.reaction);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/frequency', params: { ...params, level: id } });
    }, REACTION_NAV_DELAY);
  };

  return (
    <OnboardingFrame
      question="Quel est ton niveau ?"
      subtext="Adapte ta progression dès le départ."
      step={3}
      total={total}
      canContinue={false}
      reaction={reaction}
      hideCta
    >
      <View style={{ gap: 10 }}>
        {LEVELS.map((l) => (
          <OptionCard
            key={l.id}
            icon={l.icon}
            title={l.title}
            subtitle={l.subtitle}
            color={l.color}
            selected={selected === l.id}
            dimmed={selected !== null && selected !== l.id}
            onPress={() => handleSelect(l.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
