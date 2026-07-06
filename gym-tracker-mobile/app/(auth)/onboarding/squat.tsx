import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudCard, HudInput } from '@/components/ui/hud';
import { hud, hudType } from '@/constants/theme';
import { calculate1RM } from '@/lib/aiPlanner';

const TOTAL = 8;

function parseNum(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

export default function OnboardingSquatScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    benchW: string; benchR: string;
  }>();
  const [weightStr, setWeightStr] = useState('80');
  const [repsStr,   setRepsStr]   = useState('5');

  const wParsed = parseNum(weightStr);
  const rParsed = parseNum(repsStr);
  const weight  = Number.isFinite(wParsed) ? Math.min(Math.max(wParsed, 0), 500) : 0;
  const reps    = Number.isFinite(rParsed) ? Math.min(Math.max(Math.round(rParsed), 1), 30) : 5;

  const rm = weight > 0 ? calculate1RM(weight, reps) : null;

  const goNext = () =>
    router.push({
      pathname: '/(auth)/onboarding/deadlift',
      params: { ...params, squatW: String(weight), squatR: String(reps) },
    });

  return (
    <OnboardingFrame
      question="Ton record au squat ?"
      exercise="squat"
      subtext="Le roi des exercices — qu'est-ce que tu mets sur la barre ?"
      step={6}
      total={TOTAL}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/deadlift',
        params: { ...params, squatW: '0', squatR: '5' },
      })}
      onContinue={goNext}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Poids (kg)"
            value={weightStr}
            onChangeText={(t) => setWeightStr(t.replace(/[^0-9.,]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Répétitions"
            value={repsStr}
            onChangeText={(t) => setRepsStr(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>

      {rm !== null && (
        <HudCard
          level="g1"
          cut={hud.cut.md}
          borderColor={hud.accent.volt}
          glowColor={hud.accent.voltDim}
          padding={0}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 10, paddingVertical: 14, paddingHorizontal: 20,
          }}>
            <Text style={hudType.labelHud}>1RM estimé</Text>
            <Text style={{
              fontFamily: 'Rajdhani-Bold', fontSize: 24,
              color: hud.accent.volt, fontVariant: ['tabular-nums'],
            }}>
              {rm.toFixed(1)} kg
            </Text>
          </View>
        </HudCard>
      )}
    </OnboardingFrame>
  );
}
