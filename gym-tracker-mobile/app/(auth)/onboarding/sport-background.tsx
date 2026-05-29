import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { SportBackground } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';

const SPORTS: Array<{
  id: SportBackground;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}> = [
  { id: 'none',       icon: 'remove-circle-outline', label: 'Aucun / débutant',  color: '#94a3b8' },
  { id: 'running',    icon: 'walk',                  label: 'Course / running',  color: '#38bdf8' },
  { id: 'cycling',    icon: 'bicycle',               label: 'Vélo',              color: '#34d399' },
  { id: 'swimming',   icon: 'water',                 label: 'Natation',          color: '#60a5fa' },
  { id: 'team_sport', icon: 'football',              label: 'Sport collectif',   color: '#f59e0b' },
  { id: 'combat',     icon: 'shield',                label: 'Sport de combat',   color: '#f87171' },
  { id: 'racket',     icon: 'tennisball',            label: 'Sport de raquette', color: '#fbbf24' },
  { id: 'other',      icon: 'ellipsis-horizontal',   label: 'Autre',             color: '#a78bfa' },
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
      pose="mimi_sports"
      mascotHeight={170}
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
            subtitle=""
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

