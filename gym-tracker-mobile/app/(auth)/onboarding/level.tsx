import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { OptionCard } from '@/components/onboarding/OptionCard';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';

const LEVELS: Array<{
  id: Level;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 'beginner',     icon: 'leaf',    title: 'Débutant',      subtitle: 'Débuter ou reprendre · < 1 an',   color: '#34d399' },
  { id: 'intermediate', icon: 'barbell', title: 'Intermédiaire', subtitle: 'Régulier · 1 – 3 ans',            color: '#38bdf8' },
  { id: 'advanced',     icon: 'flash',   title: 'Avancé',        subtitle: 'Solide et structuré · 3 – 5 ans', color: '#a78bfa' },
  { id: 'elite',        icon: 'ribbon',  title: 'Élite',         subtitle: 'Compétiteur · 5 ans+',             color: '#f59e0b' },
];

export default function OnboardingLevelScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<Level | null>(null);

  const handleSelect = (id: Level) => {
    setSelected(id);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/frequency', params: { ...params, level: id } });
    }, 300);
  };

  return (
    <OnboardingFrame
      pose="mimi_level"
      mascotHeight={110}
      question="Quel est ton niveau ?"
      subtext="Adapte ta progression dès le départ."
      step={3}
      total={total}
      canContinue={false}
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
            onPress={() => handleSelect(l.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

