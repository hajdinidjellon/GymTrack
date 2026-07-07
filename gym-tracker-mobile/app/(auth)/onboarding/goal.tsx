import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  OnboardingFrame, REACTION_NAV_DELAY, type OnboardingReaction,
} from '@/components/onboarding/OnboardingFrame';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { hud } from '@/constants/theme';

type Goal = 'pr' | 'hypertrophy' | 'weight_loss' | 'consistency' | 'health';

const GOALS: Array<{
  id: Goal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  reaction: OnboardingReaction;
}> = [
  { id: 'pr',          icon: 'trophy',   title: 'Battre mes records', subtitle: 'Plus fort, plus lourd',    color: hud.accent.warn,  reaction: { text: 'Objectif verrouillé. Cap sur les records.' } },
  { id: 'hypertrophy', icon: 'body',     title: 'Prendre du muscle',  subtitle: 'Volume et hypertrophie',   color: hud.accent.pulse, reaction: { text: 'Compris. Programme axé volume.' } },
  { id: 'weight_loss', icon: 'flame',    title: 'Perdre du poids',    subtitle: 'Brûler, sculpter',         color: hud.accent.ember, reaction: { text: 'Reçu. On brûle du gras, pas du muscle.' } },
  { id: 'consistency', icon: 'calendar', title: 'Être régulier',      subtitle: 'Bâtir une vraie habitude', color: hud.cyan.primary, reaction: { text: 'La régularité bat le talent. Noté.' } },
  { id: 'health',      icon: 'heart',    title: 'Rester en forme',    subtitle: 'Santé et mobilité',        color: hud.accent.regen, reaction: { text: 'Santé d\'abord. Plan équilibré en route.' } },
];

const TOTAL = 8;

export default function OnboardingGoalScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name   = params.name ?? '';
  const [selected, setSelected] = useState<Goal | null>(null);
  const [reaction, setReaction] = useState<OnboardingReaction | null>(null);

  const handleSelect = (id: Goal) => {
    if (selected) return; // une réponse = un engagement, pas de spam
    setSelected(id);
    const goal = GOALS.find((g) => g.id === id)!;
    setReaction(goal.reaction);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/level', params: { name, goal: id } });
    }, REACTION_NAV_DELAY);
  };

  return (
    <OnboardingFrame
      question={`Quelle est ta mission principale${name ? `, ${name}` : ''} ?`}
      mood="listening"
      step={2}
      total={TOTAL}
      canContinue={false}
      reaction={reaction}
      hideCta
    >
      <View style={{ gap: 10 }}>
        {GOALS.map((g) => (
          <OptionCard
            key={g.id}
            icon={g.icon}
            title={g.title}
            subtitle={g.subtitle}
            color={g.color}
            selected={selected === g.id}
            dimmed={selected !== null && selected !== g.id}
            onPress={() => handleSelect(g.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
