import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, plateColor } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatThousands } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { workingSets } from '@/domain/progression';
import { deltaLabel, newRecords, planLift, tonnage } from '@/domain/sessionBuilder';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Check } from '@/components/ui/icons';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Chip } from '@/components/ui/Chip';
import { Sparkle } from '@/components/ui/Sparkle';
import { StatTile } from '@/components/stats/StatTile';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutStore((s) => s.workouts);
  const workout = workouts.find((w) => w.id === id);
  const ctx = useBuildContext();
  const own = ctx?.settings.customExercises;
  const records = useMemo(() => (workout ? newRecords(workout, workouts, own) : []), [workout, workouts, own]);

  // Ce que le moteur prévoit maintenant que cette séance est dans l'historique
  const next = useMemo(() => {
    if (!workout || !ctx) return [];
    return workout.exercises.flatMap((e) => {
      const def = findExerciseDef(e.name, own);
      if (!def) return [];
      const lift = planLift(def, ctx);
      const label =
        lift.decision === 'add_weight' && def.equipment === 'barbell'
          ? `+${formatKg(lift.rule.increment / 2)} / côté`
          : deltaLabel(lift);
      return [{ name: def.name, label }];
    });
  }, [workout, ctx, own]);

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
    <Screen scroll footer={<StickerButton label="Retour à l'accueil" onPress={() => router.dismissTo('/(tabs)')} />}>
      <StickerCard tone="hero" style={{ marginTop: 8, paddingVertical: 20 }}>
        <View style={{ position: 'absolute', top: 14, right: 18 }}>
          <Sparkle size={38} />
        </View>
        <View style={{ position: 'absolute', top: 52, right: 66 }}>
          <Sparkle size={20} fill={colors.card} />
        </View>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: border.strong,
            borderColor: colors.ink,
            backgroundColor: colors.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={30} />
        </View>
        <Text size={40} weight="black" accessibilityRole="header" style={{ marginTop: 14, lineHeight: 46 }}>
          Séance validée.
        </Text>
        <Text size={15} style={{ marginTop: 2 }}>
          {workout.name} · enregistrée dans ton historique
        </Text>
      </StickerCard>

      {records.map((r) => (
        <StickerCard key={r.name} tone="sun" small style={{ marginTop: 14 }}>
          <Text size={14} weight="bold">
            Nouveau record
          </Text>
          <Text size={20} weight="black" style={{ marginTop: 2 }}>
            {r.name} · {formatKg(r.weight)} kg
          </Text>
          <Text size={15}>Avant : {formatKg(r.previous)} kg</Text>
        </StickerCard>
      ))}

      <StickerCard style={{ marginTop: 18, paddingVertical: 18 }}>
        <Text size={15} weight="semibold" color={colors.inkMuted}>
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
      </StickerCard>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <StatTile value={`${workout.duration ?? 0} min`} label="durée" />
        <StatTile value={String(sets)} label={sets > 1 ? 'séries validées' : 'série validée'} />
        <StatTile
          value={String(records.length)}
          label={records.length > 1 ? 'records' : 'record'}
          highlight={records.length > 0}
        />
      </View>

      {next.length ? (
        <>
          <SectionTitle title="La prochaine fois" />
          <StickerCard style={{ paddingVertical: 4 }}>
            {next.map((n, i) => (
              <View
                key={n.name}
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderBottomWidth: i === next.length - 1 ? 0 : 2,
                  borderBottomColor: colors.line,
                }}
              >
                <Text size={16} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                  {n.name}
                </Text>
                <Chip tone={n.label.startsWith('+') ? 'success' : 'neutral'} label={n.label} />
              </View>
            ))}
          </StickerCard>
        </>
      ) : null}
    </Screen>
  );
}

/** One thin bar per 10 plates, up to 24 bars. */
function PlatePile({ count }: { count: number }) {
  const bars = Math.min(24, Math.max(1, Math.ceil(count / 10)));
  return (
    <View accessible={false} style={{ marginTop: 14, height: 60, flexDirection: 'row', alignItems: 'flex-end' }}>
      {Array.from({ length: bars }, (_, i) => (
        <View
          key={i}
          style={{
            width: 11,
            height: 40 + (i % 3) * 8,
            marginLeft: i === 0 ? 0 : -2,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: plateColor(20),
          }}
        />
      ))}
    </View>
  );
}
