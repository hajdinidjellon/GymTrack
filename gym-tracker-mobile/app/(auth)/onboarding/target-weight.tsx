import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

/** Perte saine recommandée : 0.5 à 0.8 kg / semaine */
const SAFE_LOSS_PER_WEEK = 0.6;

export default function OnboardingTargetWeightScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    weight: string; height: string;
  }>();
  const total      = getTotalSteps(parseGoal(params.goal));
  const currentKg  = Number(params.weight) || 80;
  const [target, setTarget] = useState(Math.max(50, Math.round(currentKg - 5)));

  const delta     = currentKg - target;
  const weeks     = delta > 0 ? Math.round(delta / SAFE_LOSS_PER_WEEK) : 0;
  const months    = weeks > 0 ? Math.max(1, Math.round(weeks / 4.34)) : 0;

  return (
    <OnboardingFrame
      pose="mimi_target"
      mascotHeight={180}
      question="Quel est ton objectif ?"
      subtext={`Tu pèses ${currentKg} kg aujourd'hui — vers où tu veux aller ?`}
      step={6}
      total={total}
      canContinue={true}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/cardio',
        params: { ...params, targetWeight: String(target) },
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <View style={{ width: '70%' }}>
          <Stepper value={target} onChange={setTarget} min={30} max={250} step={0.5} label="Poids cible" unit="kg" />
        </View>
      </View>

      {delta !== 0 && (
        <View style={{
          backgroundColor: delta > 0 ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)',
          borderRadius: 16, padding: 16,
          borderWidth: 1,
          borderColor: delta > 0 ? 'rgba(52,211,153,0.28)' : 'rgba(248,113,113,0.28)',
          marginTop: 4, gap: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons
              name={delta > 0 ? 'trending-down' : 'trending-up'}
              size={20}
              color={delta > 0 ? '#34d399' : '#fca5a5'}
            />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>
              {delta > 0 ? `Perdre ${delta.toFixed(1)} kg` : `Prendre ${Math.abs(delta).toFixed(1)} kg`}
            </Text>
          </View>
          {delta > 0 && weeks > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>
                Estimation réaliste : <Text style={{ color: '#34d399', fontWeight: '800' }}>~{months} mois</Text> à un rythme sain
              </Text>
            </View>
          )}
        </View>
      )}
    </OnboardingFrame>
  );
}

