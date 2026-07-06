import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  OnboardingFrame, REACTION_NAV_DELAY, type OnboardingReaction,
} from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { HealthFocus } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { hud } from '@/constants/theme';

const FOCUSES: Array<{
  id: HealthFocus;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  reaction: string;
}> = [
  { id: 'strength',  icon: 'barbell',          title: 'Force',       subtitle: 'Soulever, devenir plus fort',     color: hud.accent.pulse, reaction: 'La force. Cap enregistré.' },
  { id: 'mobility',  icon: 'body',             title: 'Mobilité',    subtitle: 'Souplesse, posture, étirements',  color: hud.cyan.bright,  reaction: 'Souplesse et longévité. Noté.' },
  { id: 'cardio',    icon: 'heart',            title: 'Cardio',      subtitle: 'Endurance, souffle, énergie',     color: hud.accent.ember, reaction: 'Moteur cardio priorisé.' },
  { id: 'balanced',  icon: 'sparkles-outline', title: 'Équilibré',   subtitle: 'Un peu de tout, varié',           color: hud.accent.regen, reaction: 'Profil polyvalent calibré.' },
];

export default function OnboardingHealthFocusScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<HealthFocus | null>(null);
  const [reaction, setReaction] = useState<OnboardingReaction | null>(null);

  const handleSelect = (id: HealthFocus) => {
    if (selected) return; // une réponse = un engagement, pas de spam
    setSelected(id);
    const focus = FOCUSES.find((f) => f.id === id)!;
    setReaction({ text: focus.reaction });
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/sport-background',
        params: { ...params, healthFocus: id },
      });
    }, REACTION_NAV_DELAY);
  };

  return (
    <OnboardingFrame
      question="Sur quoi te concentrer ?"
      subtext="On adapte ton plan à ce qui compte le plus pour toi."
      step={5}
      total={total}
      canContinue={false}
      reaction={reaction}
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
            dimmed={selected !== null && selected !== f.id}
            onPress={() => handleSelect(f.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
