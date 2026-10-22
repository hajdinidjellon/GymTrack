import React from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatShortDay } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { referenceWeight, workingSets } from '@/domain/progression';
import { exerciseHistory, planLift } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { BackButton } from '@/components/ui/BackButton';
import { LoadedBar } from '@/components/disc/LoadedBar';
import { plateSize } from '@/components/disc/Barbell';

const STEPS = [1, 2, 2.5, 5];

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

  return (
    <Screen scroll>
      <BackButton />
      <Text size={36} weight="black" style={{ marginTop: 10, lineHeight: 40 }}>
        {def.name}
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Text size={15} weight="black" color={colors.muted} style={{ letterSpacing: 1.4 }}>
          PROCHAINE CIBLE
        </Text>
        <Text size={44} weight="black" style={{ lineHeight: 50 }}>
          {lift.decision === 'calibrate'
            ? 'À régler'
            : target && target.weight > 0
              ? `${formatKg(target.weight)} kg × ${target.reps}`
              : `${target?.reps ?? 0} reps`}
        </Text>
        {def.equipment === 'barbell' && target && target.weight > 0 ? (
          <View style={{ marginTop: 8, height: 80, justifyContent: 'center' }}>
            <LoadedBar weight={target.weight} scale={0.77} barWidth={110} />
          </View>
        ) : null}
      </Card>

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
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {STEPS.map((v) => {
                const on = lift.rule.increment === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setIncrement(def.name, v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${formatKg(v)} kilos par palier`}
                    style={{
                      flex: 1,
                      height: 92,
                      borderRadius: radius.md - 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: on ? colors.cream : colors.bg,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: plateSize(v === 1 ? 1.25 : v, 0.7).height,
                        borderRadius: 2,
                        backgroundColor: on ? colors.bg : colors.cream,
                      }}
                    />
                    <Text size={17} weight="black" color={on ? colors.bg : colors.cream}>
                      {formatKg(v)}
                    </Text>
                  </Pressable>
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
