import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, plateColor } from '@/constants/theme';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { useLocale } from '@/hooks/useLocale';
import { dayName, exerciseName, t } from '@/i18n';
import { formatThousands } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { workingSets } from '@/domain/progression';
import { deltaLabel, newRecords, planLift, targetLoad, tonnage } from '@/domain/sessionBuilder';
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
import { EndTimeEditor } from '@/components/session/EndTimeEditor';

export default function Summary() {
  useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutStore((s) => s.workouts);
  const workout = workouts.find((w) => w.id === id);
  const ctx = useBuildContext();
  const factor = useLoadFactor();
  const own = ctx?.settings.customExercises;
  const records = useMemo(() => (workout ? newRecords(workout, workouts, own) : []), [workout, workouts, own]);

  // Ce que le moteur prévoit maintenant que cette séance est dans l'historique (ctx change avec la langue)
  const next = useMemo(() => {
    if (!workout || !ctx) return [];
    return workout.exercises.flatMap((e) => {
      const def = findExerciseDef(e.name, own);
      if (!def) return [];
      const lift = planLift(def, ctx);
      const label =
        lift.decision === 'add_weight' && def.equipment === 'barbell'
          ? t('session.summary.perSideIncrease', { kg: formatKg(lift.rule.increment / 2) })
          : deltaLabel(lift);
      return [{ name: def.name, label, target: targetLoad(lift.targets, def.timed, def.assisted) }];
    });
  }, [workout, ctx, own]);

  // Not found (deleted meanwhile): said, with the way home, never a blank screen
  if (!workout)
    return (
      <Screen footer={<StickerButton label={t('session.backHome')} onPress={() => router.dismissTo('/(tabs)')} />}>
        <Text size={20} style={{ marginTop: 20 }}>
          {t('history.detail.notFound')}
        </Text>
      </Screen>
    );

  const lifted = tonnage(workout, factor);
  const plates = Math.round(lifted / 20);
  const sets = workout.exercises.reduce((n, e) => n + workingSets(e.sets).length, 0);

  return (
    <Screen scroll footer={<StickerButton label={t('session.backHome')} onPress={() => router.dismissTo('/(tabs)')} />}>
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
            borderColor: colors.outline,
            backgroundColor: colors.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={30} color={colors.onSuccess} />
        </View>
        <Text size={40} weight="black" accessibilityRole="header" style={{ marginTop: 14, lineHeight: 46 }}>
          {t('session.summary.title')}
        </Text>
        <Text size={15} style={{ marginTop: 2 }}>
          {t('session.summary.saved', { name: dayName(workout.name) })}
        </Text>
      </StickerCard>

      {records.map((r) => (
        <StickerCard key={r.name} tone="sun" small style={{ marginTop: 14 }}>
          <Text size={14} weight="bold">
            {t('session.summary.newRecord')}
          </Text>
          <Text size={20} weight="black" style={{ marginTop: 2 }}>
            {t('session.summary.record', { name: exerciseName(r.name), kg: formatKg(r.weight) })}
          </Text>
          <Text size={15}>{t('session.summary.before', { kg: formatKg(r.previous) })}</Text>
        </StickerCard>
      ))}

      {/* Bodyweight, held or assisted only: nothing lifted to show, never "0 kg" */}
      {lifted > 0 ? (
        <StickerCard style={{ marginTop: 18, paddingVertical: 18 }}>
          <Text size={15} weight="semibold" color={colors.inkMuted}>
            {t('session.summary.lifted')}
          </Text>
          <Text size={44} weight="black" style={{ lineHeight: 50 }}>
            {formatThousands(lifted)} {t('common.kg')}
          </Text>
          {plates > 0 ? (
            <>
              <Text size={15} weight="bold" style={{ marginTop: 2 }}>
                {t('session.summary.plates', { count: plates, n: formatThousands(plates) })}
              </Text>
              <PlatePile count={plates} />
            </>
          ) : null}
        </StickerCard>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <StatTile value={t('common.minutes', { count: workout.duration ?? 0 })} label={t('session.summary.duration')} />
        <StatTile value={String(sets)} label={t('session.summary.setsDone', { count: sets })} />
        <StatTile
          value={String(records.length)}
          label={t('session.summary.records', { count: records.length })}
          highlight={records.length > 0}
        />
      </View>
      <EndTimeEditor workout={workout} onChange={(w) => void useWorkoutStore.getState().addWorkout(w)} />

      {next.length ? (
        <>
          <SectionTitle title={t('session.summary.nextTime')} />
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
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size={16} weight="bold" numberOfLines={1}>
                    {exerciseName(n.name)}
                  </Text>
                  <Text size={14} weight="black" color={colors.inkMuted}>
                    {n.target}
                  </Text>
                </View>
                <View>
                  <Chip tone={n.label.startsWith('+') ? 'success' : 'neutral'} label={n.label} />
                </View>
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
            borderColor: colors.drawn,
            backgroundColor: plateColor(20),
          }}
        />
      ))}
    </View>
  );
}
