import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatThousands } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { workingSets } from '@/domain/progression';
import { deltaLabel, planLift, tonnage } from '@/domain/sessionBuilder';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check } from '@/components/ui/icons';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id));
  const ctx = useBuildContext();

  // Ce que le moteur prévoit maintenant que cette séance est dans l'historique
  const next = useMemo(() => {
    if (!workout || !ctx) return [];
    return workout.exercises.flatMap((e) => {
      const def = findExerciseDef(e.name);
      if (!def) return [];
      const lift = planLift(def, ctx);
      const label =
        lift.decision === 'add_weight' && def.equipment === 'barbell'
          ? `+${formatKg(lift.rule.increment / 2)} / côté`
          : deltaLabel(lift);
      return [{ name: def.name, label }];
    });
  }, [workout, ctx]);

  if (!workout)
    return (
      <Screen>
        <View />
      </Screen>
    );

  const lifted = tonnage(workout);
  const plates = Math.round(lifted / 20);
  const sets = workout.exercises.reduce((n, e) => n + workingSets(e.sets).length, 0);

  return (
    <Screen scroll footer={<Button label="Retour à l'accueil" onPress={() => router.dismissTo('/(tabs)')} />}>
      <View
        style={{
          marginTop: 4,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={16} color={colors.cream} />
        </View>
      </View>
      <Text size={52} weight="black" style={{ marginTop: 14, lineHeight: 50 }}>
        Séance validée.
      </Text>

      <Card style={{ marginTop: 18, paddingVertical: 18 }}>
        <Text size={16} weight="semibold" color={colors.muted}>
          Tu as soulevé
        </Text>
        <Text size={56} weight="black" style={{ lineHeight: 60 }}>
          {formatThousands(lifted)} kg
        </Text>
        {plates > 0 ? (
          <>
            <Text size={17} weight="bold" style={{ marginTop: 2 }}>
              soit {formatThousands(plates)} disques de 20 kg
            </Text>
            <PlatePile count={plates} />
          </>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Stat value={`${workout.duration ?? 0} min`} label="durée" />
        <Stat value={String(sets)} label={sets > 1 ? 'séries validées' : 'série validée'} />
      </View>

      {next.length ? (
        <>
          <Text size={17} weight="bold" style={{ marginTop: 20 }}>
            La prochaine fois
          </Text>
          <View style={{ gap: 8, marginTop: 10 }}>
            {next.map((n) => (
              <View
                key={n.name}
                style={{
                  height: 60,
                  borderRadius: radius.md - 2,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text size={18} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                  {n.name}
                </Text>
                <Text size={16} weight="black">
                  {n.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18 }}>
      <Text size={36} weight="black">
        {value}
      </Text>
      <Text size={15} weight="semibold" color={colors.muted}>
        {label}
      </Text>
    </Card>
  );
}

/** One thin bar per 10 plates, up to 24 bars. */
function PlatePile({ count }: { count: number }) {
  const bars = Math.min(24, Math.max(1, Math.ceil(count / 10)));
  return (
    <View
      accessible={false}
      style={{ marginTop: 14, height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 40 + (i % 3) * 8,
            borderRadius: 2,
            backgroundColor: colors.cream,
            opacity: 0.55 + (i / 24) * 0.45,
          }}
        />
      ))}
    </View>
  );
}
