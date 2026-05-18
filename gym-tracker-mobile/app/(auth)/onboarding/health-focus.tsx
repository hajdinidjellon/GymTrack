import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { HealthFocus } from '@/types';

const FOCUSES: Array<{
  id: HealthFocus;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 'strength',  icon: 'barbell',          title: 'Force',       subtitle: 'Soulever, devenir plus fort',     color: '#f59e0b' },
  { id: 'mobility',  icon: 'body',             title: 'Mobilité',    subtitle: 'Souplesse, posture, étirements',  color: '#a78bfa' },
  { id: 'cardio',    icon: 'heart',            title: 'Cardio',      subtitle: 'Endurance, souffle, énergie',     color: '#f87171' },
  { id: 'balanced',  icon: 'sparkles-outline', title: 'Équilibré',   subtitle: 'Un peu de tout, varié',           color: '#34d399' },
];

export default function OnboardingHealthFocusScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<HealthFocus | null>(null);

  const handleSelect = (id: HealthFocus) => {
    setSelected(id);
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/sport-background',
        params: { ...params, healthFocus: id },
      });
    }, 250);
  };

  return (
    <OnboardingFrame
      pose="mimi_anatomy"
      mascotHeight={170}
      question="Sur quoi te concentrer ?"
      subtext="On adapte ton plan à ce qui compte le plus pour toi."
      step={5}
      total={total}
      canContinue={false}
      hideCta
    >
      <View style={{ gap: 12 }}>
        {FOCUSES.map((f) => {
          const isSel = selected === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => handleSelect(f.id)}
              style={({ pressed }) => ({
                borderRadius: 18,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? f.color : 'rgba(255,255,255,0.09)',
              })}
            >
              {isSel && (
                <LinearGradient
                  colors={[`${f.color}28`, `${f.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <View style={{
                flexDirection: 'row', alignItems: 'stretch',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              }}>
                <View style={{
                  width: 72,
                  backgroundColor: isSel ? `${f.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 20,
                }}>
                  <Ionicons name={f.icon} size={30} color={isSel ? f.color : 'rgba(255,255,255,0.40)'} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                  <Text style={{
                    fontSize: 18, fontWeight: '900',
                    color: isSel ? '#fff' : 'rgba(255,255,255,0.88)',
                    letterSpacing: -0.3, marginBottom: 3,
                  }}>
                    {f.title}
                  </Text>
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: isSel ? `${f.color}CC` : 'rgba(255,255,255,0.40)',
                  }}>
                    {f.subtitle}
                  </Text>
                </View>
                <View style={{ justifyContent: 'center', paddingRight: 18 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: isSel ? f.color : 'transparent',
                    borderWidth: isSel ? 0 : 2,
                    borderColor: 'rgba(255,255,255,0.25)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSel && <Ionicons name="checkmark" size={14} color="#07090f" />}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}
