import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { ToggleMascot } from '@/components/mascot/Mascot';
import { OptionCard } from '@/components/onboarding/OptionCard';

type Goal = 'pr' | 'hypertrophy' | 'weight_loss' | 'consistency' | 'health';

const GOALS: Array<{
  id: Goal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 'pr',          icon: 'trophy',   title: 'Battre mes records', subtitle: 'Plus fort, plus lourd',    color: '#f59e0b' },
  { id: 'hypertrophy', icon: 'body',     title: 'Prendre du muscle',  subtitle: 'Volume et hypertrophie',   color: '#a78bfa' },
  { id: 'weight_loss', icon: 'flame',    title: 'Perdre du poids',    subtitle: 'Brûler, sculpter',         color: '#f87171' },
  { id: 'consistency', icon: 'calendar', title: 'Être régulier',      subtitle: 'Bâtir une vraie habitude', color: '#38bdf8' },
  { id: 'health',      icon: 'heart',    title: 'Rester en forme',    subtitle: 'Santé et mobilité',        color: '#34d399' },
];

const TOTAL = 8;

export default function OnboardingGoalScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name   = params.name ?? '';
  const [selected, setSelected] = useState<Goal | null>(null);

  const handleSelect = (id: Goal) => {
    setSelected(id);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/level', params: { name, goal: id } });
    }, 300);
  };

  return (
    <OnboardingFrame
      // Ancienne mascotte statique : pose="mimi_goal" mascotHeight={150}
      customMascot={
        <View style={{ marginLeft: -105 }}>
          <ToggleMascot poseA="cache4_pos1" poseB="cache4_pos2" height={230} slideOffset={100} />
        </View>
      }
      question={`Qu'est-ce qui t'amène ici${name ? `, ${name}` : ''} ?`}
      step={2}
      total={TOTAL}
      canContinue={false}
      hideCta
    >
        <View style={{ gap: 10, marginTop: -18 }}>
          {GOALS.map((g) => (
            <OptionCard
              key={g.id}
              icon={g.icon}
              title={g.title}
              subtitle={g.subtitle}
              color={g.color}
              selected={selected === g.id}
              onPress={() => handleSelect(g.id)}
            />
          ))}
        </View>
    </OnboardingFrame>
  );
}

