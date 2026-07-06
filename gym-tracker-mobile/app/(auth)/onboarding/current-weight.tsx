import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud';
import { hud, hudType } from '@/constants/theme';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

const parseNum = (raw: string): number | null => {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function OnboardingCurrentWeightScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [weight, setWeight] = useState('80');
  const [height, setHeight] = useState('175');

  const weightNum = parseNum(weight);
  const heightNum = parseNum(height);
  const canContinue = weightNum !== null && heightNum !== null;

  return (
    <OnboardingFrame
      question="Quel est ton poids actuel ?"
      subtext="On part de là — pas de jugement, juste un point de départ."
      step={5}
      total={total}
      canContinue={canContinue}
      onContinue={() => {
        if (weightNum === null || heightNum === null) return;
        router.push({
          pathname: '/(auth)/onboarding/target-weight',
          params: { ...params, weight: String(weightNum), height: String(heightNum) },
        });
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Poids (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Taille (cm)"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: hud.glow.cyanFaint,
        borderRadius: hud.cut.md, paddingVertical: 14, paddingHorizontal: 18,
        borderWidth: 1, borderColor: hud.border.subtle,
        marginTop: 4,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: hud.cut.md,
          backgroundColor: hud.glow.cyanSoft,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="information-circle-outline" size={18} color={hud.cyan.bright} />
        </View>
        <Text style={{
          flex: 1, ...hudType.body, fontFamily: 'Rajdhani-Medium', lineHeight: 19,
        }}>
          Tes données restent locales sur ton téléphone. Tu peux les modifier à tout moment.
        </Text>
      </View>
    </OnboardingFrame>
  );
}
