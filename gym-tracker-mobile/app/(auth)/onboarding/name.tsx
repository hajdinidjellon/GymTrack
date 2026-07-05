import React, { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud/HudInput';

const TOTAL = 8;

export default function OnboardingNameScreen() {
  const [name, setName] = useState('');
  const trimmed     = name.trim();
  const canContinue = trimmed.length >= 2;

  return (
    <OnboardingFrame
      question="Comment dois-je t'appeler, pilote ?"
      subtext="Ton prénom sera utilisé pour personnaliser ton programme."
      mood="listening"
      step={1}
      total={TOTAL}
      canContinue={canContinue}
      onContinue={() =>
        router.push({ pathname: '/(auth)/onboarding/goal', params: { name: trimmed } })
      }
    >
      <HudInput
        label="Identifiant pilote"
        placeholder="Mon prénom…"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() =>
          canContinue && router.push({ pathname: '/(auth)/onboarding/goal', params: { name: trimmed } })
        }
      />
    </OnboardingFrame>
  );
}
