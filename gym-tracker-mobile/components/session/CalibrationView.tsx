import React, { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { loadingOf } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import { calibrationPreset } from '@/domain/onboarding';
import { nudge } from '@/domain/session';
import { findExerciseDef } from '@/domain/programs';
import { startPresets } from '@/domain/startWeights';
import type { ActiveExercise } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Stepper } from '@/components/ui/Stepper';
import { Barbell } from '@/components/disc/Barbell';
import { useSidePlates } from '@/components/disc/LoadedBar';
import { PlateFace } from '@/components/disc/PlateFace';
import { LoadHint } from './LoadHint';

/** First time on an exercise: pick a starting weight, the engine takes over from there. */
export function CalibrationView({ exercise }: { exercise: ActiveExercise }) {
  const loading = loadingOf(exercise);
  const customExercises = useSettingsStore((s) => s.settings.customExercises);
  // Cable or Smith comes from the catalog; the rest is on the exercise itself
  const gear = findExerciseDef(exercise.name, customExercises)?.gear;
  const presets = startPresets({ ...exercise, gear });
  const experience = useProfileStore((s) => s.profile?.experience);
  const barWeight = useSettingsStore((s) => s.settings.barWeight);
  const [weight, setWeight] = useState(() => calibrationPreset(presets, experience) ?? 20);
  const setStartWeight = useSessionStore((s) => s.setStartWeight);
  const step = exercise.rule?.increment ?? 2.5;
  // Any weight goes, down to the empty bar; off the bar, anything above zero (a 2,9 kg cable)
  const allowed = (w: number) => (loading === 'bar' ? w >= barWeight : w > 0);
  const perSide = useSidePlates(loading, weight);

  const pick = (w: number) => {
    Keyboard.dismiss();
    setWeight(w);
  };

  return (
    <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1 }}>
      <View
        style={{
          marginTop: space.md,
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

      {/* The weight and the presets share the free height, centred, instead of piling up above the button */}
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl, paddingVertical: space.md }}>
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
          <Stepper
            value={formatKg(weight)}
            unit="kg"
            onMinus={() => pick(allowed(nudge(weight, -step)) ? nudge(weight, -step) : weight)}
            onPlus={() => pick(nudge(weight, step))}
            minusLabel={`Moins ${formatKg(step)} kg`}
            plusLabel={`Plus ${formatKg(step)} kg`}
            onChange={(typed) => {
              if (allowed(typed)) setWeight(typed);
              else if (loading === 'bar') setWeight(barWeight);
            }}
            inputLabel="Charge de départ en kilos"
          />
          <LoadHint loading={loading} weight={weight} />
        </StickerCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {presets.map((v) => {
            const on = v === weight;
            return (
              <Pressable
                key={v}
                onPress={() => pick(v)}
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

      <StickerButton
        label={`Commencer à ${formatKg(weight)} kg`}
        onPress={() => {
          Keyboard.dismiss();
          setStartWeight(exercise.id, weight);
        }}
      />
    </Pressable>
  );
}
