import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';

const LEVELS: Array<{
  id: Level;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  years: string;
}> = [
  { id: 'beginner',     icon: 'leaf-outline',          title: 'Débutant',       description: 'Je débute ou reviens après une longue pause', years: '< 1 an'   },
  { id: 'intermediate', icon: 'barbell-outline',        title: 'Intermédiaire',  description: 'Je m\'entraîne régulièrement',                 years: '1 – 3 ans' },
  { id: 'advanced',     icon: 'flash-outline',          title: 'Avancé',         description: 'J\'ai une vraie base solide',                  years: '3 – 5 ans' },
  { id: 'elite',        icon: 'ribbon-outline',         title: 'Élite',          description: 'Compétiteur ou athlète confirmé',              years: '5 ans+'    },
];

const FREQUENCIES = [2, 3, 4, 5, 6];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ height: 4, flex: i === current - 1 ? 2 : 1, borderRadius: 2, backgroundColor: i < current ? '#7c3aed' : 'rgba(255,255,255,0.12)' }} />
      ))}
    </View>
  );
}

export default function OnboardingLevelScreen() {
  const params    = useLocalSearchParams<{ goal: string; name: string }>();
  const [level, setLevel]         = useState<Level | null>(null);
  const [frequency, setFrequency] = useState<number>(3);

  const freqLabel =
    frequency <= 2 ? 'Parfait pour débuter' :
    frequency <= 4 ? 'Idéal pour progresser régulièrement' :
    'Haut volume — soigne ta récupération';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#080810' }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48, gap: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <ProgressDots current={2} total={3} />

      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand.primary, letterSpacing: 2.5, textTransform: 'uppercase' }}>
          Étape 2 / 3
        </Text>
        <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 40 }}>
          Ton expérience
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 22 }}>
          On adapte les charges et la progression à ton niveau.
        </Text>
      </View>

      {/* Niveaux */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Niveau d'expérience
        </Text>
        {LEVELS.map((l) => {
          const isSelected = level === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => setLevel(l.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                padding: 16, borderRadius: 18,
                backgroundColor: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1.5, borderColor: isSelected ? '#7c3aed' : 'rgba(255,255,255,0.08)',
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isSelected ? 'rgba(124,58,237,0.20)' : 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={l.icon} size={22} color={isSelected ? '#a78bfa' : 'rgba(255,255,255,0.35)'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? '#fff' : 'rgba(255,255,255,0.80)' }}>
                    {l.title}
                  </Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.40)' }}>{l.years}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>{l.description}</Text>
              </View>
              {isSelected && (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Fréquence */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Séances par semaine
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FREQUENCIES.map((f) => {
            const isSelected = frequency === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
              >
                {isSelected ? (
                  <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>{f}</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 14 }}>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.50)' }}>{f}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.18)' }}>
          <Ionicons name="information-circle-outline" size={16} color="#a78bfa" />
          <Text style={{ fontSize: 13, color: '#c4b5fd', flex: 1 }}>{freqLabel}</Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        disabled={!level}
        onPress={() => level && router.push({ pathname: '/(auth)/onboarding/prs', params: { goal: params.goal, name: params.name, level, frequency: String(frequency) } })}
        style={{ borderRadius: 16, overflow: 'hidden', opacity: level ? 1 : 0.4 }}
      >
        <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Continuer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}
