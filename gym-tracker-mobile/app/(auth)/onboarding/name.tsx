import React, { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud';

const TOTAL = 8;

export default function OnboardingNameScreen() {
  const [name, setName] = useState('');
  const trimmed     = name.trim();
  const canContinue = trimmed.length >= 2;

  const goNext = () =>
    router.push({ pathname: '/(auth)/onboarding/goal', params: { name: trimmed } });

  return (
    <OnboardingFrame
      question="Comment tu t'appelles ?"
      subtext="Ton prénom sera utilisé pour personnaliser ton expérience."
      step={1}
      total={TOTAL}
      canContinue={canContinue}
      onContinue={goNext}
    >
      <HudInput
        label="Prénom"
        placeholder="Mon prénom..."
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() => {
          if (canContinue) goNext();
        }}
      />
    </OnboardingFrame>
  );
}
