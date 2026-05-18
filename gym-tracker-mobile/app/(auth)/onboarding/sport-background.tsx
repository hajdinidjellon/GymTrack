import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { SportBackground } from '@/types';

const SPORTS: Array<{
  id: SportBackground;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}> = [
  { id: 'none',       icon: 'remove-circle-outline', label: 'Aucun / débutant', color: '#94a3b8' },
  { id: 'running',    icon: 'walk',                  label: 'Course / running', color: '#38bdf8' },
  { id: 'cycling',    icon: 'bicycle',               label: 'Vélo',             color: '#34d399' },
  { id: 'swimming',   icon: 'water',                 label: 'Natation',         color: '#60a5fa' },
  { id: 'team_sport', icon: 'football',              label: 'Sport collectif',  color: '#f59e0b' },
  { id: 'combat',     icon: 'shield',                label: 'Sport de combat',  color: '#f87171' },
  { id: 'racket',     icon: 'tennisball',            label: 'Sport de raquette', color: '#fbbf24' },
  { id: 'other',      icon: 'ellipsis-horizontal',   label: 'Autre',            color: '#a78bfa' },
];

export default function OnboardingSportBackgroundScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; healthFocus: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<SportBackground[]>([]);

  const toggle = (id: SportBackground) => {
    // "none" est exclusif
    if (id === 'none') {
      setSelected(selected.includes('none') ? [] : ['none']);
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((s) => s !== 'none');
      return without.includes(id) ? without.filter((s) => s !== id) : [...without, id];
    });
  };

  return (
    <OnboardingFrame
      pose="mimi_sports"
      mascotHeight={170}
      question="Tu pratiquais un sport avant ?"
      subtext="Pour adapter ton plan à ton historique — tu peux en sélectionner plusieurs."
      step={6}
      total={total}
      canContinue={selected.length > 0}
      skipLabel={selected.length === 0 ? 'Passer' : undefined}
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/done',
        params: { ...params, sportBackground: '' },
      })}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/done',
        params: { ...params, sportBackground: selected.join(',') },
      })}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SPORTS.map((s) => {
          const isSel = selected.includes(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => toggle(s.id)}
              style={({ pressed }) => ({
                width: '48%',
                borderRadius: 16,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.96 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? s.color : 'rgba(255,255,255,0.09)',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              })}
            >
              {isSel && (
                <LinearGradient
                  colors={[`${s.color}28`, `${s.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingVertical: 14, paddingHorizontal: 12,
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: isSel ? `${s.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={s.icon} size={18} color={isSel ? s.color : 'rgba(255,255,255,0.40)'} />
                </View>
                <Text style={{
                  flex: 1, fontSize: 13, fontWeight: '800',
                  color: isSel ? '#fff' : 'rgba(255,255,255,0.75)',
                  letterSpacing: -0.2,
                }}>
                  {s.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}
