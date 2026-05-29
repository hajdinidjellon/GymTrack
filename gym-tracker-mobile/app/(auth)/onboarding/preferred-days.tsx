import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { DayOfWeek } from '@/types';
import { OptionCard } from '@/components/onboarding/OptionCard';

const DAYS: Array<{ id: DayOfWeek; short: string; long: string }> = [
  { id: 'mon', short: 'L', long: 'Lundi'    },
  { id: 'tue', short: 'M', long: 'Mardi'    },
  { id: 'wed', short: 'M', long: 'Mercredi' },
  { id: 'thu', short: 'J', long: 'Jeudi'    },
  { id: 'fri', short: 'V', long: 'Vendredi' },
  { id: 'sat', short: 'S', long: 'Samedi'   },
  { id: 'sun', short: 'D', long: 'Dimanche' },
];

export default function OnboardingPreferredDaysScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total      = getTotalSteps(parseGoal(params.goal));
  const targetFreq = Math.max(1, Number(params.frequency) || 3);
  const [selected, setSelected] = useState<DayOfWeek[]>([]);

  const toggle = (id: DayOfWeek) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const isMatch = selected.length === targetFreq;
  const canContinue = selected.length > 0;

  return (
    <OnboardingFrame
      pose="mimi_calendar"
      mascotHeight={170}
      question="Quels jours veux-tu t'entraîner ?"
      subtext={`Tu vises ${targetFreq} séance${targetFreq > 1 ? 's' : ''} par semaine — sélectionne tes jours.`}
      step={5}
      total={total}
      canContinue={canContinue}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/time-of-day',
        params: { ...params, preferredDays: selected.join(',') },
      })}
    >
      <View style={{ gap: 8 }}>
        {DAYS.map((d) => (
          <OptionCard
            key={d.id}
            icon="calendar-outline"
            title={d.long}
            subtitle={d.short}
            color="#38bdf8"
            selected={selected.includes(d.id)}
            onPress={() => toggle(d.id)}
          />
        ))}
      </View>

      {/* Indicateur de match avec la fréquence */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: isMatch ? 'rgba(52,211,153,0.10)' : 'rgba(12,14,26,0.82)',
        borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: isMatch ? 'rgba(52,211,153,0.30)' : 'rgba(12,14,26,0.88)',
        marginTop: 4,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: isMatch ? 'rgba(52,211,153,0.22)' : 'rgba(12,14,26,0.88)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons
            name={isMatch ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
            color={isMatch ? '#34d399' : 'rgba(255,255,255,0.55)'}
          />
        </View>
        <Text style={{ flex: 1, fontSize: 13, color: '#fff', fontWeight: '600', lineHeight: 18 }}>
          {selected.length === 0
            ? `Sélectionne au moins ${targetFreq} jour${targetFreq > 1 ? 's' : ''}`
            : isMatch
              ? `Parfait, ${selected.length} jours sélectionnés !`
              : `${selected.length}/${targetFreq} jours — ${selected.length < targetFreq ? 'ajoute' : 'retire'} ${Math.abs(targetFreq - selected.length)} jour${Math.abs(targetFreq - selected.length) > 1 ? 's' : ''}`}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

