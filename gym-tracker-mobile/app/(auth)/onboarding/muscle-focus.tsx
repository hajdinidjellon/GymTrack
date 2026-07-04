import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { MuscleGroup } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';

type Choice = {
  id: MuscleGroup;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

const CHOICES: Choice[] = [
  { id: 'chest',     icon: 'body-outline',   label: 'Pectoraux', color: '#f87171' },
  { id: 'back',      icon: 'arrow-up',       label: 'Dos',       color: '#38bdf8' },
  { id: 'shoulders', icon: 'triangle',       label: 'Épaules',   color: '#a78bfa' },
  { id: 'arms',      icon: 'fitness',        label: 'Bras',      color: '#f59e0b' },
  { id: 'legs',      icon: 'walk',           label: 'Jambes',    color: '#34d399' },
  { id: 'glutes',    icon: 'ellipse',        label: 'Fessiers',  color: '#e879f9' },
  { id: 'core',      icon: 'shield',         label: 'Abdos',     color: '#fbbf24' },
  { id: 'calves',    icon: 'caret-down',     label: 'Mollets',   color: '#60a5fa' },
];

export default function OnboardingMuscleFocusScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<MuscleGroup[]>([]);

  const toggle = (id: MuscleGroup) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <OnboardingFrame
      pose="mimi_anatomy"
      mascotHeight={170}
      question="Quels muscles veux-tu prioriser ?"
      subtext="Sélectionne jusqu'à 3 zones — ton plan d'entraînement leur donnera plus de volume."
      step={5}
      total={total}
      canContinue={selected.length > 0}
      skipLabel={selected.length === 0 ? 'Pas de préférence' : undefined}
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/body-stats',
        params: { ...params, muscleFocus: '' },
      })}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/body-stats',
        params: { ...params, muscleFocus: selected.join(',') },
      })}
    >
      <View style={{ gap: 10 }}>
        {CHOICES.map((c) => (
          <OptionCard
            key={c.id}
            icon={c.icon}
            title={c.label}
            subtitle=""
            color={c.color}
            selected={selected.includes(c.id)}
            onPress={() => toggle(c.id)}
            iconSize={24}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

