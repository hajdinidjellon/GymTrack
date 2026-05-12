import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { calculate1RM } from '@/lib/aiPlanner';
import { pushAllToCloud } from '@/lib/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { UserProfile, PersonalRecord } from '@/types';

const TOTAL = 8;

export default function OnboardingOHPScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    benchW: string; benchR: string;
    squatW: string; squatR: string;
    deadW:  string; deadR:  string;
  }>();

  const [weight,  setWeight]  = useState(40);
  const [reps,    setReps]    = useState(5);
  const [loading, setLoading] = useState(false);

  const { saveProfile } = useProfileStore();
  const { loadWorkouts } = useWorkoutStore();

  const rm = weight > 0 ? calculate1RM(weight, reps) : null;

  const handleFinish = async (ohpW: number, ohpR: number) => {
    setLoading(true);

    const exercises = [
      { name: 'Développé couché',    w: parseFloat(params.benchW ?? '0'), r: parseInt(params.benchR ?? '5', 10) },
      { name: 'Squat',               w: parseFloat(params.squatW ?? '0'), r: parseInt(params.squatR ?? '5', 10) },
      { name: 'Soulevé de terre',    w: parseFloat(params.deadW  ?? '0'), r: parseInt(params.deadR  ?? '3', 10) },
      { name: 'Développé militaire', w: ohpW,                              r: ohpR },
    ];

    const prs: PersonalRecord[] = exercises
      .filter((e) => e.w > 0)
      .map((e) => ({
        exercise:   e.name,
        weight:     e.w,
        reps:       e.r,
        oneRepMax:  calculate1RM(e.w, e.r),
        date:       new Date().toISOString(),
      }));

    const profile: UserProfile = {
      name:              params.name?.trim() ?? '',
      height:            175,
      gender:            'male',
      experienceLevel:   (params.level as UserProfile['experienceLevel']) ?? 'beginner',
      prs,
      bodyStats:         [],
      trainingFrequency: parseInt(params.frequency ?? '3', 10),
      goals:             [],
    };

    await saveProfile(profile);
    await loadWorkouts();
    pushAllToCloud().catch(() => null);
    router.replace({ pathname: '/(auth)/onboarding/done', params: { name: profile.name } });
  };

  return (
    <OnboardingFrame
      pose="overhead"
      mascotHeight={190}
      question="Et le développé militaire ?"
      subtext="Dernier effort — qu'est-ce que tu mets au-dessus de la tête ?"
      step={8}
      total={TOTAL}
      canContinue={true}
      ctaLabel="Terminer"
      ctaIcon="rocket-outline"
      loading={loading}
      skipLabel="Je ne sais pas encore"
      onSkip={() => handleFinish(0, 5)}
      onContinue={() => handleFinish(weight, reps)}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={weight} onChange={setWeight} min={0} max={300} step={2.5} label="Poids" unit="kg" />
        <Stepper value={reps}   onChange={setReps}   min={1} max={30}  step={1}   label="Répétitions" />
      </View>

      {rm !== null && weight > 0 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(245,158,11,0.10)',
          borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
          borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)',
          gap: 8,
        }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
            1RM estimé
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fcd34d', letterSpacing: -0.5 }}>
            {rm.toFixed(1)} kg
          </Text>
        </View>
      )}
    </OnboardingFrame>
  );
}
