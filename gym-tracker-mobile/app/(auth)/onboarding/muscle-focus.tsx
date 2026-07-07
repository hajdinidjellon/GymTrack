import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud } from '@/constants/theme';
import type { MuscleGroup } from '@/types';

type Choice = {
  id: MuscleGroup;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

const CHOICES: Choice[] = [
  { id: 'chest',     icon: 'body-outline', label: 'Pectoraux', color: hud.accent.pulse },
  { id: 'back',      icon: 'arrow-up',     label: 'Dos',       color: hud.cyan.primary },
  { id: 'shoulders', icon: 'triangle',     label: 'Épaules',   color: hud.cyan.bright },
  { id: 'arms',      icon: 'fitness',      label: 'Bras',      color: hud.accent.ember },
  { id: 'legs',      icon: 'walk',         label: 'Jambes',    color: hud.accent.regen },
  { id: 'glutes',    icon: 'ellipse',      label: 'Fessiers',  color: hud.accent.pulse },
  { id: 'core',      icon: 'shield',       label: 'Abdos',     color: hud.accent.warn },
  { id: 'calves',    icon: 'caret-down',   label: 'Mollets',   color: hud.cyan.primary },
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
