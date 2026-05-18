import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import type { TimeOfDay } from '@/types';

type Slot = {
  id: TimeOfDay;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  color: string;
  defaultHour: string;
};

const SLOTS: Slot[] = [
  { id: 'morning', icon: 'sunny-outline',    title: 'Matin',  hint: 'Avant 12 h',        color: '#fbbf24', defaultHour: '07:00' },
  { id: 'midday',  icon: 'partly-sunny',     title: 'Midi',   hint: 'Entre 12 h et 17 h', color: '#f59e0b', defaultHour: '12:30' },
  { id: 'evening', icon: 'moon-outline',     title: 'Soir',   hint: 'Après 17 h',         color: '#818cf8', defaultHour: '19:00' },
];

export default function OnboardingTimeOfDayScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; preferredDays: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));
  const [selected, setSelected] = useState<TimeOfDay | null>(null);

  const handleSelect = (s: Slot) => {
    setSelected(s.id);
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/onboarding/reminder',
        params: { ...params, timeOfDay: s.id, defaultReminder: s.defaultHour },
      });
    }, 250);
  };

  return (
    <OnboardingFrame
      pose="mimi_clock"
      mascotHeight={170}
      question="À quel moment de la journée ?"
      subtext="Identifie ton créneau pour caler tes séances."
      step={6}
      total={total}
      canContinue={false}
      hideCta
    >
      <View style={{ gap: 12 }}>
        {SLOTS.map((s) => {
          const isSel = selected === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => handleSelect(s)}
              style={({ pressed }) => ({
                borderRadius: 18,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? s.color : 'rgba(255,255,255,0.09)',
              })}
            >
              {isSel && (
                <LinearGradient
                  colors={[`${s.color}28`, `${s.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              }}>
                <View style={{
                  width: 76, paddingVertical: 22,
                  backgroundColor: isSel ? `${s.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={s.icon} size={32} color={isSel ? s.color : 'rgba(255,255,255,0.40)'} />
                </View>
                <View style={{ flex: 1, paddingVertical: 18, paddingHorizontal: 16 }}>
                  <Text style={{
                    fontSize: 19, fontWeight: '900',
                    color: isSel ? '#fff' : 'rgba(255,255,255,0.88)',
                    letterSpacing: -0.4, marginBottom: 3,
                  }}>
                    {s.title}
                  </Text>
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: isSel ? `${s.color}CC` : 'rgba(255,255,255,0.40)',
                  }}>
                    {s.hint}
                  </Text>
                </View>
                <View style={{ paddingRight: 18 }}>
                  <Text style={{
                    fontSize: 14, fontWeight: '800', letterSpacing: 0.5,
                    color: isSel ? s.color : 'rgba(255,255,255,0.30)',
                  }}>
                    {s.defaultHour}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}
