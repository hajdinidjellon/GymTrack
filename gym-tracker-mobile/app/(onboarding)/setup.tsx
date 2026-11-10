import React from 'react';
import { router } from 'expo-router';
import { answersSplit, type OnboardingAnswers } from '@/domain/onboarding';
import { trainingCount } from '@/domain/schedule';
import { customProgramSettings } from '@/domain/customProgram';
import { hasExercises, programDays } from '@/domain/programs';
import { useLocale } from '@/hooks/useLocale';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { OnboardingFlow, type FlowEnd } from '@/components/onboarding/OnboardingFlow';
import { resetTo } from '@/components/navigation/resetTo';

export default function Setup() {
  useLocale();
  const finish = async (answers: OnboardingAnswers, end: FlowEnd) => {
    const profile = useProfileStore.getState().profile;
    useSettingsStore.getState().updateSettings({
      barWeight: answers.barWeight,
      plates: answers.plates,
      stackStep: answers.stackStep,
      cableStep: answers.cableStep,
      gymChain: answers.gym,
      signedOut: false,
    });
    const split = answersSplit(answers);
    // « Autre » : the program the user named, its sessions and the exercises copied into them
    if (split === 'custom' && answers.custom) {
      const settings = useSettingsStore.getState().settings;
      useSettingsStore.getState().updateSettings(customProgramSettings(settings, answers.custom));
    }
    const bodyStats = profile?.bodyStats ?? [];
    await useProfileStore.getState().saveProfile({
      goal: answers.goal,
      // The days picked become the week; skipped, the sessions simply follow each other
      program: answers.schedule
        ? { split, perWeek: trainingCount(answers.schedule), schedule: answers.schedule }
        : { split, perWeek: answers.perWeek },
      experience: answers.experience,
      // Not said: not saved
      ...(answers.sex ? { sex: answers.sex } : {}),
      ...(answers.ageGroup ? { ageGroup: answers.ageGroup } : {}),
      sessionMinutes: answers.sessionMinutes,
      prs: profile?.prs ?? [],
      bodyStats:
        answers.bodyWeight != null
          ? [...bodyStats, { date: new Date().toISOString(), weight: answers.bodyWeight }]
          : bodyStats,
    });
    resetTo('/(tabs)');
    if (end !== 'session') return;
    // Sessions still empty: their exercises are picked first
    const s = useSettingsStore.getState().settings;
    const empty = programDays(split, s.customDays, s.customExercises, s.ownDays).some((d) => !hasExercises(d));
    router.push(split === 'custom' && empty ? '/days' : '/session/preview');
  };

  return <OnboardingFlow onExit={() => router.back()} onFinish={finish} />;
}
