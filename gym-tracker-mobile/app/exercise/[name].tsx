import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatShortDay } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { referenceWeight, workingSets } from '@/domain/progression';
import { exerciseHistory, lastTimeLabel, planLift, reasonLabel, weightHistory } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { BackButton } from '@/components/ui/BackButton';
import { LoadedBar } from '@/components/disc/LoadedBar';
import { Sparkline } from '@/components/stats/Sparkline';
import { PressableScale } from '@/components/ui/PressableScale';

const STEPS = [1, 2, 2.5, 5];

const EQUIPMENT = { barbell: 'Barre', dumbbell: 'Haltères', machine: 'Machine', bodyweight: 'Poids du corps' };

export default function ExerciseScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const def = findExerciseDef(name ?? '');
  const ctx = useBuildContext();
  const setIncrement = useSettingsStore((s) => s.setIncrement);

  if (!def || !ctx) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          Exercice introuvable.
        </Text>
      </Screen>
    );
  }

  const lift = planLift(def, ctx);
  const target = lift.targets[0];
  const history = exerciseHistory(def, ctx.workouts).slice(0, 5);
  const bodyweight = def.equipment === 'bodyweight';
  const weights = weightHistory(def, ctx.workouts).map((p) => p.weight);

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader eyebrow={EQUIPMENT[def.equipment]} title={def.name} />

      <Card>
        <Text size={15} weight="black" color={colors.muted} style={{ letterSpacing: 1.4 }}>
          PROCHAINE CIBLE
        </Text>
        <Text size={34} weight="black" style={{ lineHeight: 40 }}>
          {lift.decision === 'calibrate'
            ? 'À régler'
            : target && target.weight > 0
              ? `${formatKg(target.weight)} kg × ${target.reps}`
              : `${target?.reps ?? 0} reps`}
        </Text>
        <Text size={14} color={colors.accent} style={{ marginTop: 4, lineHeight: 19 }}>
          {reasonLabel(lift)}
        </Text>
        {lift.last.length ? (
          <Text size={15} color={colors.muted} style={{ marginTop: 2 }}>
            Dernière fois : {lastTimeLabel(lift.last)}
          </Text>
        ) : null}
        {def.equipment === 'barbell' && target && target.weight > 0 ? (
          <View style={{ marginTop: 8, height: 80, justifyContent: 'center' }}>
            <LoadedBar weight={target.weight} scale={0.77} barWidth={110} />
          </View>
        ) : null}
      </Card>

      {weights.length > 1 ? (
        <Card style={{ marginTop: 12, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={13} weight="black" color={colors.faint} style={{ letterSpacing: 1.3 }}>
              TA CHARGE
            </Text>
            <Text size={14} weight="bold" color={colors.muted}>
              {formatKg(weights[0]!)} → {formatKg(weights[weights.length - 1]!)} kg
            </Text>
          </View>
          <Sparkline values={weights} height={72} />
        </Card>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text size={16} weight="semibold" color={colors.muted}>
            Règle
          </Text>
          <Text size={22} weight="black">
            {lift.rule.sets} × {lift.rule.repMin}–{lift.rule.repMax} reps
          </Text>
        </View>
        {!bodyweight ? (
          <>
            <Text size={16} weight="semibold" color={colors.muted} style={{ marginTop: 14 }}>
              Ajouter à chaque palier
            </Text>
            <View
              accessibilityRole="radiogroup"
              style={{
                flexDirection: 'row',
                marginTop: 10,
                padding: 4,
                gap: 4,
                borderRadius: radius.pill,
                backgroundColor: colors.bg,
              }}
            >
              {STEPS.map((v) => {
                const on = lift.rule.increment === v;
                return (
                  <PressableScale
                    key={v}
                    haptic="selection"
                    onPress={() => setIncrement(def.name, v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${formatKg(v)} kilos par palier`}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? colors.cream : 'transparent',
                    }}
                  >
                    <Text size={15} weight="black" color={on ? colors.bg : colors.muted}>
                      +{formatKg(v)} kg
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </>
        ) : null}
      </Card>

      {history.length ? (
        <>
          <Text size={17} weight="bold" style={{ marginTop: 20 }}>
            Dernières séances
          </Text>
          <View style={{ marginTop: 4 }}>
            {history.map((h, i) => {
              const sets = workingSets(h.sets);
              const w = referenceWeight(sets);
              return (
                <View
                  key={h.date}
                  style={{
                    height: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: i < history.length - 1 ? 1 : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text size={16} color={colors.muted}>
                    {formatShortDay(h.date)}
                  </Text>
                  <Text size={18} weight="black">
                    {w > 0 ? `${formatKg(w)} × ` : ''}
                    {sets.map((s) => s.reps).join(' · ')}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
