import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { formatShortDay, formatThousands } from '@/domain/format';
import { formatKg, platesForSide, platesPhrase } from '@/domain/plates';
import { allExercises } from '@/domain/programs';
import { weightHistory } from '@/domain/sessionBuilder';
import { personalBests, weeklyVolume, weekTrend } from '@/domain/stats';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { exerciseName, getLocale, t } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StickerButton } from '@/components/ui/StickerButton';
import { Text } from '@/components/ui/Text';
import { StickerCard } from '@/components/ui/StickerCard';
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
  useLocale();
  const workouts = useWorkoutStore((s) => s.workouts);
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const available = useSettingsStore((s) => s.settings.plates);
  const own = useSettingsStore((s) => s.settings.customExercises);

  const lifts = useMemo<LiftProgress[]>(
    () =>
      allExercises(own).flatMap((def) => {
        const points = weightHistory(def, workouts);
        const first = points[0];
        const last = points[points.length - 1];
        if (!first || !last) return [];
        return [{ name: def.name, barbell: def.equipment === 'barbell', points, first, last }];
      }),
    [workouts, own],
  );
  const factor = useLoadFactor();
  const weeks = useMemo(() => weeklyVolume(workouts, 8, new Date(), factor), [workouts, factor]);
  const allRecords = useMemo(() => personalBests(workouts, allExercises(own)), [workouts, own]);
  const records = allRecords.slice(0, 5);

  if (workouts.length === 0) {
    return (
      <Screen tabs footer={<StickerButton label={t('progress.empty.cta')} onPress={() => router.navigate('/')} />}>
        <ScreenHeader title={t('progress.title')} subtitle={t('progress.subtitle')} />
        <StickerCard style={{ marginTop: space.sm, alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
          <Barbell perSide={[]} scale={0.8} barWidth={80} />
          <Text size={20} weight="black" align="center">
            {t('progress.empty.title')}
          </Text>
          <Text size={15} color={colors.inkMuted} align="center" style={{ lineHeight: 21, maxWidth: 280 }}>
            {t('progress.empty.text')}
          </Text>
        </StickerCard>
      </Screen>
    );
  }

  const thisWeek = weeks[weeks.length - 1]!;
  const trend = weekTrend(workouts, new Date(), factor);
  const gained = lifts.reduce((sum, l) => sum + Math.max(0, l.last.weight - l.first.weight), 0);

  // La plus belle progression à la barre, racontée en disques
  const hero = lifts
    .filter((l) => l.barbell && l.last.weight > l.first.weight)
    .sort((a, b) => b.last.weight - b.first.weight - (a.last.weight - a.first.weight))[0];
  const loadOf = (w: number) => platesForSide(Math.max(0, (w - bar) / 2), available);

  return (
    <Screen tabs scroll>
      <FadeIn>
        <ScreenHeader title={t('progress.title')} subtitle={t('progress.subtitle')} />
      </FadeIn>

      <FadeIn index={1} style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile value={String(workouts.length)} label={t('progress.tiles.sessions', { count: workouts.length })} />
        <StatTile
          value={t('progress.tiles.gainedValue', { kg: formatKg(gained) })}
          label={t('progress.tiles.gained')}
          highlight={gained > 0}
        />
        <StatTile value={String(allRecords.length)} label={t('progress.tiles.records', { count: allRecords.length })} />
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle
          title={t('progress.volume.title')}
          right={
            trend != null ? (
              <Chip tone={trend >= 0 ? 'sun' : 'neutral'} label={`${trend >= 0 ? '+' : ''}${trend} %`} />
            ) : undefined
          }
        />
        <StickerCard>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: space.md }}>
            <Text size={28} weight="black">
              {formatThousands(thisWeek.tonnage)}
            </Text>
            <Text size={14} weight="bold" color={colors.inkMuted}>
              {t('progress.volume.thisWeek')}
            </Text>
          </View>
          <VolumeChart weeks={weeks} />
        </StickerCard>
      </FadeIn>

      {hero ? (
        <FadeIn index={3}>
          <SectionTitle title={t('progress.hero.title')} />
          <StickerCard tone="hero" style={{ gap: space.md }}>
            <Text size={14} weight="semibold">
              {t('progress.hero.since', { name: exerciseName(hero.name), date: sinceDate(hero.first.date) })}
            </Text>
            <Text size={22} weight="black" style={{ lineHeight: 27 }}>
              {t('progress.hero.gained', {
                plates: platesPhrase((hero.last.weight - hero.first.weight) / 2, available),
              })}
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
                    <Text size={13} weight="semibold">
                      {i === 0 ? t('progress.hero.start') : t('progress.hero.now')}
                    </Text>
                    <Text size={20} weight="black">
                      {formatKg(point.weight)} {t('common.kg')}
                    </Text>
                  </View>
                  <View style={{ flex: 1, height: 80, justifyContent: 'center' }}>
                    <Barbell perSide={after} scale={0.62} barWidth={40} highlightFrom={shared} />
                  </View>
                </View>
              );
            })}
          </StickerCard>
        </FadeIn>
      ) : null}

      {records.length ? (
        <FadeIn index={4}>
          <SectionTitle title={t('progress.records.title')} />
          <StickerCard style={{ paddingVertical: 4 }}>
            {records.map((r, i) => (
              <View
                key={r.name}
                style={{
                  minHeight: 54,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                  borderBottomWidth: i === records.length - 1 ? 0 : 2,
                  borderBottomColor: colors.line,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size={16} weight="bold" numberOfLines={1}>
                    {exerciseName(r.name)}
                  </Text>
                  <Text size={13} color={colors.inkMuted}>
                    {t('progress.records.meta', { date: formatShortDay(r.date), reps: r.reps })}
                  </Text>
                </View>
                <View>
                  <Chip tone="sun" label={`${formatKg(r.weight)} ${t('common.kg')}`} />
                </View>
              </View>
            ))}
          </StickerCard>
        </FadeIn>
      ) : null}

      <FadeIn index={5}>
        <SectionTitle title={t('progress.lifts.title')} />
        <View style={{ gap: space.md }}>
          {lifts.map((l) => {
            const diff = l.last.weight - l.first.weight;
            const name = exerciseName(l.name);
            const kg = formatKg(l.last.weight);
            return (
              <PressableScale
                key={l.name}
                haptic="selection"
                onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: l.name } })}
                accessibilityRole="button"
                accessibilityLabel={
                  diff > 0
                    ? t('progress.lifts.a11yGain', { name, kg, diff: formatKg(diff) })
                    : t('progress.lifts.a11y', { name, kg })
                }
              >
                <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text size={16} weight="bold" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text size={13} color={colors.inkMuted}>
                      {kg} kg ·{' '}
                      {diff > 0
                        ? `+${formatKg(diff)} kg`
                        : diff < 0
                          ? `−${formatKg(-diff)} kg`
                          : t('progress.lifts.stable')}
                    </Text>
                  </View>
                  <View style={{ width: 72 }}>
                    <Sparkline values={l.points.map((p) => p.weight)} height={34} />
                  </View>
                  <ChevronRight size={18} />
                </StickerCard>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>
    </Screen>
  );
}

/** "mar. 14 oct." after "depuis le" in French; the date as is in English. */
function sinceDate(iso: string): string {
  const day = formatShortDay(iso);
  return getLocale() === 'fr' ? day.toLowerCase() : day;
}
