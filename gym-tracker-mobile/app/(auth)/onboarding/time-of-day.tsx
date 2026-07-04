import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { TimeOfDay } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';

type Slot = {
  id: TimeOfDay;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  color: string;
  defaultHour: string;
};

const SLOTS: Slot[] = [
  { id: 'morning', icon: 'sunny-outline',    title: 'Matin',  hint: 'Avant 12 h',        color: '#fbbf24', defaultHour: '07:00' },
  { id: 'midday',  icon: 'partly-sunny',     title: 'Midi',   hint: 'Entre 12 h et 17 h', color: '#f59e0b', defaultHour: '12:30' },
  { id: 'evening', icon: 'moon-outline',     title: 'Soir',   hint: 'Après 17 h',         color: '#818cf8', defaultHour: '19:00' },
];

export default function OnboardingTimeOfDayScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; preferredDays: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<TimeOfDay | null>(null);

  const handleSelect = (s: Slot) => {
    setSelected(s.id);
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/reminder',
        params: { ...params, timeOfDay: s.id, defaultReminder: s.defaultHour },
      });
    }, 250);
  };

  return (
    <OnboardingFrame
      pose="mimi_clock"
      mascotHeight={170}
      question="À quel moment de la journée ?"
      subtext="Identifie ton créneau pour caler tes séances."
      step={6}
      total={total}
      canContinue={false}
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
            onPress={() => handleSelect(s)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

