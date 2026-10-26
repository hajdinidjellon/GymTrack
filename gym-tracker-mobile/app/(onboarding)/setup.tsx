import React from 'react';
import { router } from 'expo-router';
import { splitFor, type OnboardingAnswers } from '@/domain/onboarding';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { OnboardingFlow, type FlowEnd } from '@/components/onboarding/OnboardingFlow';

export default function Setup() {
  const finish = async (answers: OnboardingAnswers, end: FlowEnd) => {
    const profile = useProfileStore.getState().profile;
    useSettingsStore.getState().updateSettings({
      barWeight: answers.barWeight,
      plates: answers.plates,
      signedOut: false,
    });
    await useProfileStore.getState().saveProfile({
      goal: answers.goal,
      program: { split: splitFor(answers.perWeek), perWeek: answers.perWeek },
      experience: answers.experience,
      prs: profile?.prs ?? [],
      bodyStats: profile?.bodyStats ?? [],
    });
    router.dismissAll();
    router.replace('/(tabs)');
    if (end === 'session') router.push('/session/preview');
  };

  return <OnboardingFlow onExit={() => router.back()} onFinish={finish} />;
}
