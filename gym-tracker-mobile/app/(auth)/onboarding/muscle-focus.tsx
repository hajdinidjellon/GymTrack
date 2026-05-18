import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { MuscleGroup } from '@/types';

type Choice = {
  id: MuscleGroup;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
};

const CHOICES: Choice[] = [
  { id: 'chest',     icon: 'body-outline',   label: 'Pectoraux', color: '#f87171' },
  { id: 'back',      icon: 'arrow-up',       label: 'Dos',       color: '#38bdf8' },
  { id: 'shoulders', icon: 'triangle',       label: 'Épaules',   color: '#a78bfa' },
  { id: 'arms',      icon: 'fitness',        label: 'Bras',      color: '#f59e0b' },
  { id: 'legs',      icon: 'walk',           label: 'Jambes',    color: '#34d399' },
  { id: 'glutes',    icon: 'ellipse',        label: 'Fessiers',  color: '#e879f9' },
  { id: 'core',      icon: 'shield',         label: 'Abdos',     color: '#fbbf24' },
  { id: 'calves',    icon: 'caret-down',     label: 'Mollets',   color: '#60a5fa' },
];

export default function OnboardingMuscleFocusScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<MuscleGroup[]>([]);

  const toggle = (id: MuscleGroup) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <OnboardingFrame
      pose="mimi_anatomy"
      mascotHeight={170}
      question="Quels muscles veux-tu prioriser ?"
      subtext="Sélectionne jusqu'à 3 zones — ton plan d'entraînement leur donnera plus de volume."
      step={5}
      total={total}
      canContinue={selected.length > 0}
      skipLabel={selected.length === 0 ? 'Pas de préférence' : undefined}
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/body-stats',
        params: { ...params, muscleFocus: '' },
      })}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/body-stats',
        params: { ...params, muscleFocus: selected.join(',') },
      })}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {CHOICES.map((c) => {
          const isSel = selected.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              style={({ pressed }) => ({
                width: '48%',
                borderRadius: 16,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.96 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? c.color : 'rgba(255,255,255,0.09)',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              })}
            >
              {isSel && (
                <LinearGradient
                  colors={[`${c.color}28`, `${c.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 16, paddingHorizontal: 14,
              }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: isSel ? `${c.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={c.icon} size={20} color={isSel ? c.color : 'rgba(255,255,255,0.40)'} />
                </View>
                <Text style={{
                  flex: 1, fontSize: 15, fontWeight: '800',
                  color: isSel ? '#fff' : 'rgba(255,255,255,0.75)',
                  letterSpacing: -0.2,
                }}>
                  {c.label}
                </Text>
                {isSel && (
                  <Ionicons name="checkmark-circle" size={18} color={c.color} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}
