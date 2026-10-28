import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { loadingOf, type Loading } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import { calibrationPreset } from '@/domain/onboarding';
import type { ActiveExercise } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Barbell } from '@/components/disc/Barbell';
import { useSidePlates } from '@/components/disc/LoadedBar';
import { PlateFace } from '@/components/disc/PlateFace';
import { LoadHint } from './LoadHint';

/** Starting weights to pick from: the whole bar, one side of the machine, one dumbbell, the stack. */
const PRESETS: Record<Loading, number[]> = {
  bar: [20, 30, 40, 50, 60, 80],
  perSide: [10, 15, 20, 25, 30, 40],
  perHand: [6, 8, 10, 12, 16, 20],
  stack: [10, 20, 30, 40, 50, 60],
};

/** First time on an exercise: pick a starting weight, the engine takes over from there. */
export function CalibrationView({ exercise }: { exercise: ActiveExercise }) {
  const loading = loadingOf(exercise);
  const presets = PRESETS[loading];
  const experience = useProfileStore((s) => s.profile?.experience);
  const barWeight = useSettingsStore((s) => s.settings.barWeight);
  const [weight, setWeight] = useState(() => calibrationPreset(presets, experience) ?? 20);
  const setStartWeight = useSessionStore((s) => s.setStartWeight);
  const step = exercise.rule?.increment ?? 2.5;
  const min = loading === 'bar' ? barWeight : step;
  const perSide = useSidePlates(loading, weight);

  return (
    <View style={{ flex: 1 }}>
      {/* The free height is shared between the blocks instead of piling up above the button */}
      <View style={{ flex: 1, justifyContent: 'space-evenly', gap: space.md, paddingVertical: space.sm }}>
        <View
          style={{
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
            {loading === 'bar' ? 'Charge ta barre de départ.' : 'Choisis ta charge de départ.'} Ensuite, on s'occupe de
            tout.
          </Text>
        </View>

        <StickerCard tone="hero" style={{ paddingHorizontal: 12, paddingVertical: 18, gap: space.sm }}>
          {loading === 'bar' ? (
            <View style={{ height: 120, justifyContent: 'center' }}>
              <Barbell perSide={perSide} scale={1.08} />
            </View>
          ) : null}
          {loading === 'perSide' && perSide.length ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            >
              {perSide.map((kg, i) => (
                <PlateFace key={i} kg={kg} size={Math.min(72, Math.floor(280 / perSide.length))} />
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Round
              label="−"
              a11y={`Moins ${formatKg(step)} kg`}
              onPress={() => setWeight((w) => Math.max(min, w - step))}
            />
            <Text size={64} weight="black" style={{ lineHeight: 70 }}>
              {formatKg(weight)}{' '}
              <Text size={22} weight="black">
                kg
              </Text>
            </Text>
            <Round label="+" a11y={`Plus ${formatKg(step)} kg`} onPress={() => setWeight((w) => w + step)} />
          </View>
          <LoadHint loading={loading} weight={weight} />
        </StickerCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {presets.map((v) => {
            const on = v === weight;
            return (
              <Pressable
                key={v}
                onPress={() => setWeight(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${v} kilos`}
                style={{
                  // Three per row: 30 % plus the gaps leaves no room for a fourth
                  flexBasis: '30%',
                  flexGrow: 1,
                  height: 64,
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
      </View>

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
