import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';

const LEVELS: Array<{
  id: Level;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  years: string;
  color: string;
}> = [
  { id: 'beginner',     icon: 'leaf',    title: 'Débutant',      subtitle: 'Je commence ou je reprends',     years: '< 1 an',    color: '#34d399' },
  { id: 'intermediate', icon: 'barbell', title: 'Intermédiaire', subtitle: 'Je m\'entraîne régulièrement',   years: '1 – 3 ans', color: '#38bdf8' },
  { id: 'advanced',     icon: 'flash',   title: 'Avancé',        subtitle: 'Base solide et structurée',       years: '3 – 5 ans', color: '#a78bfa' },
  { id: 'elite',        icon: 'ribbon',  title: 'Élite',         subtitle: 'Compétiteur confirmé',            years: '5 ans+',    color: '#f59e0b' },
];

const TOTAL = 8;

export default function OnboardingLevelScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string }>();
  const [selected, setSelected] = useState<Level | null>(null);

  const handleSelect = (id: Level) => {
    setSelected(id);
    setTimeout(() => {
      router.push({ pathname: '/(auth)/onboarding/frequency', params: { ...params, level: id } });
    }, 300);
  };

  return (
    <OnboardingFrame
      pose="flex_v2"
      mascotHeight={150}
      question="Quel est ton niveau ?"
      subtext="Adapte ta progression dès le départ."
      step={3}
      total={TOTAL}
      canContinue={false}
      hideCta
    >
      <View style={{ gap: 12 }}>
        {LEVELS.map((l) => {
          const isSel = selected === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => handleSelect(l.id)}
              style={({ pressed }) => ({
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                borderWidth: 2,
                borderColor: isSel ? l.color : 'rgba(255,255,255,0.09)',
              })}
            >
              {isSel && (
                <LinearGradient
                  colors={[`${l.color}28`, `${l.color}10`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}

              <View style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                backgroundColor: isSel ? 'transparent' : 'rgba(255,255,255,0.04)',
              }}>
                {/* Bloc icône */}
                <View style={{
                  width: 76,
                  backgroundColor: isSel ? `${l.color}28` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 22,
                }}>
                  <Ionicons
                    name={l.icon as keyof typeof Ionicons.glyphMap}
                    size={34}
                    color={isSel ? l.color : 'rgba(255,255,255,0.35)'}
                  />
                </View>

                {/* Texte + badge années */}
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  gap: 5,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{
                      fontSize: 20, fontWeight: '900',
                      color: isSel ? '#fff' : 'rgba(255,255,255,0.88)',
                      letterSpacing: -0.4,
                    }}>
                      {l.title}
                    </Text>
                    <View style={{
                      backgroundColor: isSel ? `${l.color}30` : 'rgba(255,255,255,0.09)',
                      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '800',
                        color: isSel ? l.color : 'rgba(255,255,255,0.40)',
                        letterSpacing: 0.3,
                      }}>
                        {l.years}
                      </Text>
                    </View>
                  </View>
                  <Text style={{
                    fontSize: 14,
                    color: isSel ? `${l.color}CC` : 'rgba(255,255,255,0.40)',
                    fontWeight: '600',
                  }}>
                    {l.subtitle}
                  </Text>
                </View>

                {/* Radio */}
                <View style={{ justifyContent: 'center', paddingRight: 18 }}>
                  <View style={{
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: isSel ? l.color : 'transparent',
                    borderWidth: isSel ? 0 : 2,
                    borderColor: 'rgba(255,255,255,0.22)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSel && <Ionicons name="checkmark" size={15} color="#07090f" />}
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
