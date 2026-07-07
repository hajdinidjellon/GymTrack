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

export default function OnboardingDeadliftScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    benchW: string; benchR: string; squatW: string; squatR: string;
  }>();
  const [weightStr, setWeightStr] = useState('100');
  const [repsStr,   setRepsStr]   = useState('3');

  const wParsed = parseNum(weightStr);
  const rParsed = parseNum(repsStr);
  const weight  = Number.isFinite(wParsed) ? Math.min(Math.max(wParsed, 0), 500) : 0;
  const reps    = Number.isFinite(rParsed) ? Math.min(Math.max(Math.round(rParsed), 1), 20) : 3;

  const rm = weight > 0 ? calculate1RM(weight, reps) : null;

  const goNext = () =>
    router.push({
      pathname: '/(auth)/onboarding/connect',
      params: { ...params, deadW: String(weight), deadR: String(reps) },
    });

  return (
    <OnboardingFrame
      question="Ton record au soulevé de terre ?"
      exercise="deadlift"
      subtext="Le mouvement le plus complet — quelle est ta meilleure performance ?"
      step={7}
      total={TOTAL}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, deadW: '0', deadR: '3' },
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
