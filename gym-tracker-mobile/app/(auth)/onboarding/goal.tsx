import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';

type Goal = 'pr' | 'hypertrophy' | 'weight_loss' | 'consistency' | 'health';

const GOALS: Array<{
  id: Goal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 'pr',          icon: 'trophy',          title: 'Battre mes records',  subtitle: 'Plus fort, plus lourd',       color: '#f59e0b' },
  { id: 'hypertrophy', icon: 'body',             title: 'Prendre du muscle',   subtitle: 'Volume et hypertrophie',      color: '#a78bfa' },
  { id: 'weight_loss', icon: 'flame',            title: 'Perdre du poids',     subtitle: 'Brûler, sculpter',            color: '#f87171' },
  { id: 'consistency', icon: 'calendar',         title: 'Être régulier',       subtitle: 'Bâtir une vraie habitude',    color: '#38bdf8' },
  { id: 'health',      icon: 'heart',            title: 'Rester en forme',     subtitle: 'Santé et mobilité',           color: '#34d399' },
];

const TOTAL = 8;

export default function OnboardingGoalScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name   = params.name ?? '';
  const [selected, setSelected] = useState<Goal | null>(null);

  const handleSelect = (id: Goal) => {
    setSelected(id);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/level', params: { name, goal: id } });
    }, 300);
  };

  return (
    <OnboardingFrame
      pose="pensive"
      mascotHeight={130}
      question={`Qu'est-ce qui t'amène ici${name ? `, ${name}` : ''} ?`}
      step={2}
      total={TOTAL}
      canContinue={false}
      hideCta
    >
      <View style={{ gap: 10 }}>
        {GOALS.map((g) => {
          const isSel = selected === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => handleSelect(g.id)}
              style={({ pressed }) => ({
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? g.color : 'rgba(255,255,255,0.09)',
              })}
            >
              {/* Fond coloré si sélectionné */}
              {isSel && (
                <LinearGradient
                  colors={[`${g.color}28`, `${g.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}

              <View style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              }}>
                {/* Bloc icône — pleine hauteur */}
                <View style={{
                  width: 72,
                  backgroundColor: isSel ? `${g.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 20,
                }}>
                  <Ionicons
                    name={g.icon as keyof typeof Ionicons.glyphMap}
                    size={32}
                    color={isSel ? g.color : 'rgba(255,255,255,0.38)'}
                  />
                </View>

                {/* Texte */}
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                }}>
                  <Text style={{
                    fontSize: 18, fontWeight: '900',
                    color: isSel ? '#fff' : 'rgba(255,255,255,0.85)',
                    letterSpacing: -0.3, marginBottom: 3,
                  }}>
                    {g.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: isSel ? `${g.color}CC` : 'rgba(255,255,255,0.38)',
                    fontWeight: '600',
                  }}>
                    {g.subtitle}
                  </Text>
                </View>

                {/* Radio indicator */}
                <View style={{ justifyContent: 'center', paddingRight: 18 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: isSel ? g.color : 'transparent',
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
