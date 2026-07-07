import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud } from '@/constants/theme';
import type { SportBackground } from '@/types';

const SPORTS: Array<{
  id: SportBackground;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}> = [
  { id: 'none',       icon: 'remove-circle-outline', label: 'Aucun / débutant',  color: hud.cyan.dim },
  { id: 'running',    icon: 'walk',                  label: 'Course / running',  color: hud.cyan.primary },
  { id: 'cycling',    icon: 'bicycle',               label: 'Vélo',              color: hud.accent.regen },
  { id: 'swimming',   icon: 'water',                 label: 'Natation',          color: hud.cyan.bright },
  { id: 'team_sport', icon: 'football',              label: 'Sport collectif',   color: hud.accent.warn },
  { id: 'combat',     icon: 'shield',                label: 'Sport de combat',   color: hud.accent.pulse },
  { id: 'racket',     icon: 'tennisball',            label: 'Sport de raquette', color: hud.accent.ember },
  { id: 'other',      icon: 'ellipsis-horizontal',   label: 'Autre',             color: hud.cyan.primary },
];

export default function OnboardingSportBackgroundScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; healthFocus: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<SportBackground[]>([]);

  const toggle = (id: SportBackground) => {
    if (id === 'none') {
      setSelected(selected.includes('none') ? [] : ['none']);
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((s) => s !== 'none');
      return without.includes(id) ? without.filter((s) => s !== id) : [...without, id];
    });
  };

  return (
    <OnboardingFrame
      question="Tu pratiquais un sport avant ?"
      subtext="Pour adapter ton plan à ton historique — tu peux en sélectionner plusieurs."
      step={6}
      total={total}
      canContinue={selected.length > 0}
      skipLabel={selected.length === 0 ? 'Passer' : undefined}
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, sportBackground: '' },
      })}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, sportBackground: selected.join(',') },
      })}
    >
      <View style={{ gap: 10 }}>
        {SPORTS.map((s) => (
          <OptionCard
            key={s.id}
            icon={s.icon}
            title={s.label}
            color={s.color}
            selected={selected.includes(s.id)}
            onPress={() => toggle(s.id)}
            iconSize={24}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
