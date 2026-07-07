import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Canvas, Path as SkPath } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { octagonPath } from '@/components/ui/hud';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud } from '@/constants/theme';
import type { DayOfWeek } from '@/types';

const DAYS: Array<{ id: DayOfWeek; label: string }> = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mer' },
  { id: 'thu', label: 'Jeu' },
  { id: 'fri', label: 'Ven' },
  { id: 'sat', label: 'Sam' },
  { id: 'sun', label: 'Dim' },
];

const PILL_H = 46;

// ── Pill octogonale de jour (HUD) ──────────────────────────────────
function DayPill({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const [w, setW] = useState(0);
  const path = useMemo(
    () => (w > 0 ? octagonPath(0.75, 0.75, w - 1.5, PILL_H - 1.5, hud.cut.sm) : null),
    [w],
  );

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => null);
        onPress();
      }}
      style={({ pressed }) => ({
        width: '22%', flexGrow: 1,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{ height: PILL_H, alignItems: 'center', justifyContent: 'center' }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {path && (
          <Canvas
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, width: w, height: PILL_H }}
          >
            <SkPath
              path={path}
              color={selected ? hud.cyan.deep : hud.bg.surfaceDeep}
              style="fill"
            />
            <SkPath
              path={path}
              color={selected ? hud.cyan.primary : hud.border.subtle}
              style="stroke"
              strokeWidth={selected ? 1.5 : 1}
            />
          </Canvas>
        )}
        <Text style={{
          fontFamily: 'Rajdhani-SemiBold', fontSize: 13,
          letterSpacing: 2, textTransform: 'uppercase',
          color: selected ? hud.cyan.bright : hud.text.secondary,
        }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DAYS.map((d) => (
          <DayPill
            key={d.id}
            label={d.label}
            selected={selected.includes(d.id)}
            onPress={() => toggle(d.id)}
          />
        ))}
      </View>

      {/* Indicateur de match avec la fréquence */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: isMatch ? hud.accent.regenDim : hud.bg.surfaceDeep,
        borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: isMatch ? hud.accent.regen : hud.border.hairline,
        marginTop: 4,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: isMatch ? hud.accent.regenDim : hud.bg.surface,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons
            name={isMatch ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
            color={isMatch ? hud.accent.regen : hud.text.secondary}
          />
        </View>
        <Text style={{
          flex: 1, fontFamily: 'Rajdhani-SemiBold', fontSize: 14,
          color: hud.text.primary, lineHeight: 18,
        }}>
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
