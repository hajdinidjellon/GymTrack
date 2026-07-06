import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud';
import { hud, hudType } from '@/constants/theme';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

/** Perte saine recommandée : 0.5 à 0.8 kg / semaine */
const SAFE_LOSS_PER_WEEK = 0.6;

const parseNum = (raw: string): number | null => {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function OnboardingTargetWeightScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    weight: string; height: string;
  }>();
  const total      = getTotalSteps(parseGoal(params.goal));
  const currentKg  = Number(params.weight) || 80;
  const [target, setTarget] = useState(String(Math.max(50, Math.round(currentKg - 5))));

  const targetNum   = parseNum(target);
  const canContinue = targetNum !== null;

  const delta  = targetNum !== null ? currentKg - targetNum : 0;
  const weeks  = delta > 0 ? Math.round(delta / SAFE_LOSS_PER_WEEK) : 0;
  const months = weeks > 0 ? Math.max(1, Math.round(weeks / 4.34)) : 0;

  const deltaColor    = delta > 0 ? hud.accent.regen : hud.accent.ember;
  const deltaColorDim = delta > 0 ? hud.accent.regenDim : hud.accent.emberDim;

  return (
    <OnboardingFrame
      question="Quel est ton objectif ?"
      subtext={`Tu pèses ${currentKg} kg aujourd'hui — vers où tu veux aller ?`}
      step={6}
      total={total}
      canContinue={canContinue}
      onContinue={() => {
        if (targetNum === null) return;
        router.push({
          pathname: '/(auth)/onboarding/cardio',
          params: { ...params, targetWeight: String(targetNum) },
        });
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <View style={{ width: '70%' }}>
          <HudInput
            big
            label="Poids cible (kg)"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
      </View>

      {targetNum !== null && delta !== 0 && (
        <View style={{
          backgroundColor: deltaColorDim,
          borderRadius: hud.cut.md, padding: 16,
          borderWidth: 1,
          borderColor: `${deltaColor}40`,
          marginTop: 4, gap: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons
              name={delta > 0 ? 'trending-down' : 'trending-up'}
              size={20}
              color={deltaColor}
            />
            <Text style={{
              flex: 1, fontFamily: 'Rajdhani-Bold', fontSize: 17,
              color: hud.text.primary, letterSpacing: 0.3,
            }}>
              {delta > 0 ? `Perdre ${delta.toFixed(1)} kg` : `Prendre ${Math.abs(delta).toFixed(1)} kg`}
            </Text>
          </View>
          {delta > 0 && weeks > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-outline" size={14} color={hud.text.secondary} />
              <Text style={{ ...hudType.bodyDim, fontFamily: 'Rajdhani-Medium' }}>
                Estimation réaliste :{' '}
                <Text style={{ color: hud.accent.regen, fontFamily: 'Rajdhani-Bold' }}>
                  ~{months} mois
                </Text>{' '}
                à un rythme sain
              </Text>
            </View>
          )}
        </View>
      )}
    </OnboardingFrame>
  );
}
