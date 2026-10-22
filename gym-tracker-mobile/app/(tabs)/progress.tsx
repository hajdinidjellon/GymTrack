import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { formatShortDay, formatThousands } from '@/domain/format';
import { formatKg, platesForSide, platesPhrase } from '@/domain/plates';
import { EXERCISES } from '@/domain/programs';
import { weightHistory } from '@/domain/sessionBuilder';
import { personalBests, weeklyVolume } from '@/domain/stats';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { ChevronRight } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { Sparkline } from '@/components/stats/Sparkline';
import { StatTile } from '@/components/stats/StatTile';
import { VolumeChart } from '@/components/stats/VolumeChart';

interface LiftProgress {
  name: string;
  barbell: boolean;
  points: { date: string; weight: number }[];
  first: { date: string; weight: number };
  last: { date: string; weight: number };
}

export default function Progress() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const available = useSettingsStore((s) => s.settings.plates);

  const lifts = useMemo<LiftProgress[]>(
    () =>
      Object.values(EXERCISES).flatMap((def) => {
        const points = weightHistory(def, workouts);
        const first = points[0];
        const last = points[points.length - 1];
        if (!first || !last) return [];
        return [{ name: def.name, barbell: def.equipment === 'barbell', points, first, last }];
      }),
    [workouts],
  );
  const weeks = useMemo(() => weeklyVolume(workouts, 8), [workouts]);
  const records = useMemo(() => personalBests(workouts).slice(0, 5), [workouts]);

  if (workouts.length === 0) {
    return (
      <Screen tabs footer={<Button label="Voir la séance du jour" onPress={() => router.navigate('/')} />}>
        <ScreenHeader title="Progrès" subtitle="Ce que tu as gagné depuis le début, en disques." />
        <Card style={{ marginTop: space.sm, alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
          <Barbell perSide={[]} scale={0.8} barWidth={80} />
          <Text size={20} weight="black" align="center">
            Ta barre est encore vide
          </Text>
          <Text size={15} color={colors.muted} align="center" style={{ lineHeight: 21, maxWidth: 280 }}>
            Fais ta première séance : tes courbes, ton volume et tes records s'afficheront ici.
          </Text>
        </Card>
      </Screen>
    );
  }

  const thisWeek = weeks[weeks.length - 1]!;
  const lastWeek = weeks[weeks.length - 2];
  const trend = lastWeek?.tonnage ? Math.round(((thisWeek.tonnage - lastWeek.tonnage) / lastWeek.tonnage) * 100) : null;
  const gained = lifts.reduce((sum, l) => sum + Math.max(0, l.last.weight - l.first.weight), 0);

  // La plus belle progression à la barre, racontée en disques
  const hero = lifts
    .filter((l) => l.barbell && l.last.weight > l.first.weight)
    .sort((a, b) => b.last.weight - b.first.weight - (a.last.weight - a.first.weight))[0];
  const loadOf = (w: number) => platesForSide(Math.max(0, (w - bar) / 2), available);

  return (
    <Screen tabs scroll>
      <FadeIn>
        <ScreenHeader title="Progrès" subtitle="Ce que tu as gagné depuis le début, en disques." />
      </FadeIn>

      <FadeIn index={1} style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile value={String(workouts.length)} label={workouts.length > 1 ? 'séances' : 'séance'} />
        <StatTile value={`+${formatKg(gained)} kg`} label="gagnés au total" accent={gained > 0} />
        <StatTile value={String(records.length)} label={records.length > 1 ? 'records' : 'record'} />
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle
          title="Volume par semaine"
          right={
            trend != null ? (
              <Chip tone={trend >= 0 ? 'brass' : 'neutral'} label={`${trend >= 0 ? '+' : ''}${trend} %`} />
            ) : undefined
          }
        />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: space.md }}>
            <Text size={28} weight="black">
              {formatThousands(thisWeek.tonnage)}
            </Text>
            <Text size={14} weight="bold" color={colors.muted}>
              kg cette semaine
            </Text>
          </View>
          <VolumeChart weeks={weeks} />
        </Card>
      </FadeIn>

      {hero ? (
        <FadeIn index={3}>
          <SectionTitle title="Ta plus belle progression" />
          <Card style={{ gap: space.md }}>
            <Text size={14} weight="semibold" color={colors.muted}>
              {hero.name} · depuis le {formatShortDay(hero.first.date).toLowerCase()}
            </Text>
            <Text size={22} weight="black" style={{ lineHeight: 27 }}>
              Tu as gagné {platesPhrase((hero.last.weight - hero.first.weight) / 2, available)} de chaque côté.
            </Text>
            {[hero.first, hero.last].map((point, i) => {
              const before = loadOf(hero.first.weight);
              const after = loadOf(point.weight);
              // Les disques déjà là au départ sont estompés, ceux gagnés sont pleins
              let shared = 0;
              while (i > 0 && shared < before.length && before[shared] === after[shared]) shared++;
              if (i === 0) shared = after.length;
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ width: 92 }}>
                    <Text size={13} color={colors.muted}>
                      {i === 0 ? 'Au début' : 'Maintenant'}
                    </Text>
                    <Text size={20} weight="black" color={i === 0 ? colors.cream : colors.brass}>
                      {formatKg(point.weight)} kg
                    </Text>
                  </View>
                  <View style={{ flex: 1, height: 80, justifyContent: 'center' }}>
                    <Barbell perSide={after} scale={0.62} barWidth={40} highlightFrom={shared} />
                  </View>
                </View>
              );
            })}
          </Card>
        </FadeIn>
      ) : null}

      {records.length ? (
        <FadeIn index={4}>
          <SectionTitle title="Tes records" />
          <Card style={{ paddingVertical: 4 }}>
            {records.map((r, i) => (
              <View
                key={r.name}
                style={{
                  minHeight: 54,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                  borderBottomWidth: i === records.length - 1 ? 0 : 1,
                  borderBottomColor: colors.hairline,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size={16} weight="bold" numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text size={13} color={colors.muted}>
                    {formatShortDay(r.date)} · {r.reps} reps
                  </Text>
                </View>
                <Text size={18} weight="black" color={colors.brass}>
                  {formatKg(r.weight)} kg
                </Text>
              </View>
            ))}
          </Card>
        </FadeIn>
      ) : null}

      <FadeIn index={5}>
        <SectionTitle title="Tous tes exercices" />
        <View style={{ gap: space.sm }}>
          {lifts.map((l) => {
            const diff = l.last.weight - l.first.weight;
            return (
              <PressableScale
                key={l.name}
                haptic="selection"
                onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: l.name } })}
                accessibilityRole="button"
                accessibilityLabel={`${l.name}, ${formatKg(l.last.weight)} kilos${diff > 0 ? `, plus ${formatKg(diff)} depuis le début` : ''}`}
              >
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text size={16} weight="bold" numberOfLines={1}>
                      {l.name}
                    </Text>
                    <Text size={13} color={colors.muted}>
                      {formatKg(l.last.weight)} kg · {diff > 0 ? `+${formatKg(diff)} kg` : 'stable'}
                    </Text>
                  </View>
                  <View style={{ width: 72 }}>
                    <Sparkline values={l.points.map((p) => p.weight)} height={34} />
                  </View>
                  <ChevronRight size={16} color={colors.faint} />
                </Card>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>
    </Screen>
  );
}
