import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { ToggleMascot } from '@/components/mascot/Mascot';

const TOTAL = 8;

export default function OnboardingNameScreen() {
  const [name, setName] = useState('');
  const trimmed     = name.trim();
  const canContinue = trimmed.length >= 2;

  return (
    <OnboardingFrame
      pose="mimi2_name"
      mascotHeight={160}
      question="Comment tu t'appelles ?"
      subtext="Ton prénom sera utilisé pour personnaliser ton expérience."
      step={1}
      total={TOTAL}
      hideBack
      canContinue={canContinue}
      onContinue={() =>
        router.push({ pathname: '/(auth)/onboarding/goal', params: { name: trimmed } })
      }
      aboveCta={
        <View style={{ alignItems: 'center', paddingBottom: 4 }}>
          <ToggleMascot poseA="cache3_pos1" poseB="cache3_pos2" height={180} />
        </View>
      }
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18, borderWidth: 1.5,
        borderColor: canContinue ? '#38bdf8' : 'rgba(255,255,255,0.12)',
        paddingHorizontal: 18,
      }}>
        <Ionicons name="person-outline" size={20} color={canContinue ? '#38bdf8' : 'rgba(255,255,255,0.30)'} />
        <TextInput
          style={{ flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', paddingVertical: 20 }}
          placeholder="Mon prénom..."
          placeholderTextColor="rgba(255,255,255,0.22)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={() =>
            canContinue && router.push({ pathname: '/(auth)/onboarding/goal', params: { name: trimmed } })
          }
        />
        {canContinue && <Ionicons name="checkmark-circle" size={22} color="#38bdf8" />}
      </View>
    </OnboardingFrame>
  );
}
