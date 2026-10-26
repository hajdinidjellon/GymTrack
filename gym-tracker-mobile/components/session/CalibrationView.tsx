import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, hardShadow, radius } from '@/constants/theme';
import { describeSide, formatKg } from '@/domain/plates';
import type { ActiveExercise } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';

const PRESETS: Record<ActiveExercise['equipment'], number[]> = {
  barbell: [20, 30, 40, 50, 60, 80],
  dumbbell: [6, 8, 10, 12, 16, 20],
  machine: [10, 20, 30, 40, 50, 60],
  bodyweight: [],
};

/** First time on an exercise: pick a starting weight, the engine takes over from there. */
export function CalibrationView({ exercise }: { exercise: ActiveExercise }) {
  const presets = PRESETS[exercise.equipment];
  const [weight, setWeight] = useState(presets[2] ?? 20);
  const setStartWeight = useSessionStore((s) => s.setStartWeight);
  const step = exercise.rule?.increment ?? 2.5;
  const min = exercise.equipment === 'barbell' ? 20 : step;
  const perSide = usePerSide(weight);
  const barbell = exercise.equipment === 'barbell';

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          marginTop: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderColor: colors.ink,
          backgroundColor: colors.sun,
        }}
      >
        <Text size={15} weight="black">
          Première fois
        </Text>
        <Text size={15} weight="semibold">
          {barbell ? 'Charge ta barre de départ.' : 'Choisis ta charge de départ.'} Ensuite, on s'occupe de tout.
        </Text>
      </View>

      <StickerCard tone="hero" style={{ marginTop: 16, paddingHorizontal: 12, paddingBottom: 14 }}>
        {barbell ? (
          <View style={{ height: 120, justifyContent: 'center' }}>
            <Barbell perSide={perSide} scale={1.08} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Round
            label="−"
            a11y={`Moins ${formatKg(step)} kg`}
            onPress={() => setWeight((w) => Math.max(min, w - step))}
          />
          <View style={{ alignItems: 'center' }}>
            <Text size={56} weight="black" style={{ lineHeight: 62 }}>
              {formatKg(weight)}{' '}
              <Text size={20} weight="black">
                kg
              </Text>
            </Text>
            {barbell ? (
              <Text size={14} weight="bold" color={colors.inkMuted}>
                {perSide.length ? `Par côté : ${describeSide(perSide)}` : 'Barre à vide'}
              </Text>
            ) : null}
          </View>
          <Round label="+" a11y={`Plus ${formatKg(step)} kg`} onPress={() => setWeight((w) => w + step)} />
        </View>
      </StickerCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
        {presets.map((v) => {
          const on = v === weight;
          return (
            <Pressable
              key={v}
              onPress={() => setWeight(v)}
              accessibilityRole="button"
              accessibilityLabel={`${v} kilos`}
              style={{
                width: '31.5%',
                height: 60,
                borderRadius: radius.row,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: on ? border.strong : border.base,
                borderColor: colors.ink,
                backgroundColor: on ? colors.coralSoft : colors.card,
                ...(on ? hardShadow(2) : {}),
              }}
            >
              <Text size={26} weight="black">
                {v}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <StickerButton label={`Commencer à ${formatKg(weight)} kg`} onPress={() => setStartWeight(exercise.id, weight)} />
    </View>
  );
}

function Round({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: border.base,
        borderColor: colors.ink,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        ...(pressed ? {} : hardShadow(2)),
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      <Text size={30} weight="black">
        {label}
      </Text>
    </Pressable>
  );
}
