import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { HealthFocus } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';

const FOCUSES: Array<{
  id: HealthFocus;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 'strength',  icon: 'barbell',          title: 'Force',       subtitle: 'Soulever, devenir plus fort',     color: '#f59e0b' },
  { id: 'mobility',  icon: 'body',             title: 'Mobilité',    subtitle: 'Souplesse, posture, étirements',  color: '#a78bfa' },
  { id: 'cardio',    icon: 'heart',            title: 'Cardio',      subtitle: 'Endurance, souffle, énergie',     color: '#f87171' },
  { id: 'balanced',  icon: 'sparkles-outline', title: 'Équilibré',   subtitle: 'Un peu de tout, varié',           color: '#34d399' },
];

export default function OnboardingHealthFocusScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<HealthFocus | null>(null);

  const handleSelect = (id: HealthFocus) => {
    setSelected(id);
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/sport-background',
        params: { ...params, healthFocus: id },
      });
    }, 250);
  };

  return (
    <OnboardingFrame
      pose="mimi_anatomy"
      mascotHeight={170}
      question="Sur quoi te concentrer ?"
      subtext="On adapte ton plan à ce qui compte le plus pour toi."
      step={5}
      total={total}
      canContinue={false}
      hideCta
    >
      <View style={{ gap: 12 }}>
        {FOCUSES.map((f) => (
          <OptionCard
            key={f.id}
            icon={f.icon}
            title={f.title}
            subtitle={f.subtitle}
            color={f.color}
            selected={selected === f.id}
            onPress={() => handleSelect(f.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

