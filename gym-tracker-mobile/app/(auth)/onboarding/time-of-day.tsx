import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  OnboardingFrame, REACTION_NAV_DELAY, type OnboardingReaction,
} from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { TimeOfDay } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { hud } from '@/constants/theme';

type Slot = {
  id: TimeOfDay;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  color: string;
  defaultHour: string;
  reaction: string;
};

const SLOTS: Slot[] = [
  { id: 'morning', icon: 'sunny-outline', title: 'Matin',  hint: 'Avant 12 h',         color: hud.accent.warn,  defaultHour: '07:00', reaction: 'Les aubes forgent les records.' },
  { id: 'midday',  icon: 'partly-sunny',  title: 'Midi',   hint: 'Entre 12 h et 17 h', color: hud.accent.ember, defaultHour: '12:30', reaction: 'Créneau solaire verrouillé.' },
  { id: 'evening', icon: 'moon-outline',  title: 'Soir',   hint: 'Après 17 h',         color: hud.cyan.primary, defaultHour: '19:00', reaction: 'Le soir, pleine puissance.' },
];

export default function OnboardingTimeOfDayScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; preferredDays: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<TimeOfDay | null>(null);
  const [reaction, setReaction] = useState<OnboardingReaction | null>(null);

  const handleSelect = (s: Slot) => {
    if (selected) return; // une réponse = un engagement, pas de spam
    setSelected(s.id);
    setReaction({ text: s.reaction });
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/reminder',
        params: { ...params, timeOfDay: s.id, defaultReminder: s.defaultHour },
      });
    }, REACTION_NAV_DELAY);
  };

  return (
    <OnboardingFrame
      question="À quel moment de la journée ?"
      subtext="Identifie ton créneau pour caler tes séances."
      step={6}
      total={total}
      canContinue={false}
      reaction={reaction}
      hideCta
    >
      <View style={{ gap: 12 }}>
        {SLOTS.map((s) => (
          <OptionCard
            key={s.id}
            icon={s.icon}
            title={s.title}
            subtitle={s.hint}
            color={s.color}
            selected={selected === s.id}
            dimmed={selected !== null && selected !== s.id}
            onPress={() => handleSelect(s)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
