import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatThousands } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { workingSets } from '@/domain/progression';
import { deltaLabel, newRecords, planLift, tonnage } from '@/domain/sessionBuilder';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check } from '@/components/ui/icons';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Chip } from '@/components/ui/Chip';
import { StatTile } from '@/components/stats/StatTile';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutStore((s) => s.workouts);
  const workout = workouts.find((w) => w.id === id);
  const records = useMemo(() => (workout ? newRecords(workout, workouts) : []), [workout, workouts]);
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
      <Text size={40} weight="black" accessibilityRole="header" style={{ marginTop: 14, lineHeight: 42 }}>
        Séance validée.
      </Text>
      <Text size={15} color={colors.muted} style={{ marginTop: 6 }}>
        {workout.name} · enregistrée dans ton historique
      </Text>

      {records.map((r) => (
        <Card
          key={r.name}
          style={{ marginTop: 14, borderWidth: 1.5, borderColor: colors.brass, backgroundColor: colors.brassSoft }}
        >
          <Text size={12} weight="black" color={colors.brass} style={{ letterSpacing: 1.3 }}>
            NOUVEAU RECORD
          </Text>
          <Text size={20} weight="black" style={{ marginTop: 2 }}>
            {r.name} · {formatKg(r.weight)} kg
          </Text>
          <Text size={15} color={colors.muted}>
            Avant : {formatKg(r.previous)} kg
          </Text>
        </Card>
      ))}

      <Card style={{ marginTop: 18, paddingVertical: 18 }}>
        <Text size={14} weight="semibold" color={colors.muted}>
          Tu as soulevé
        </Text>
        <Text size={44} weight="black" style={{ lineHeight: 50 }}>
          {formatThousands(lifted)} kg
        </Text>
        {plates > 0 ? (
          <>
            <Text size={15} weight="bold" style={{ marginTop: 2 }}>
              soit {formatThousands(plates)} disques de 20 kg
            </Text>
            <PlatePile count={plates} />
          </>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <StatTile value={`${workout.duration ?? 0} min`} label="durée" />
        <StatTile value={String(sets)} label={sets > 1 ? 'séries validées' : 'série validée'} />
        <StatTile
          value={String(records.length)}
          label={records.length > 1 ? 'records' : 'record'}
          accent={records.length > 0}
        />
      </View>

      {next.length ? (
        <>
          <SectionTitle title="La prochaine fois" />
          <Card style={{ paddingVertical: 4 }}>
            {next.map((n, i) => (
              <View
                key={n.name}
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderBottomWidth: i === next.length - 1 ? 0 : 1,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text size={16} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                  {n.name}
                </Text>
                <Chip tone={n.label.startsWith('+') ? 'brass' : 'neutral'} label={n.label} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
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
