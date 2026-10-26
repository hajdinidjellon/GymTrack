import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { formatDay, formatShortDay, formatThousands } from '@/domain/format';
import { describeSide, formatKg } from '@/domain/plates';
import {
  breakLabel,
  deltaLabel,
  targetLabel,
  tonnage,
  toActiveExercises,
  type PlannedDay,
  type PlannedLift,
} from '@/domain/sessionBuilder';
import { weekDays } from '@/domain/stats';
import { weekStreak, workoutsThisWeek } from '@/domain/week';
import { useTodayPlan } from '@/hooks/useTodayPlan';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Chip } from '@/components/ui/Chip';
import { Sparkle } from '@/components/ui/Sparkle';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { ChevronRight } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { WeekStrip } from '@/components/stats/WeekStrip';

function start(plan: PlannedDay) {
  useSessionStore.getState().startSession(plan.name, toActiveExercises(plan));
  router.push('/session');
}

export default function Today() {
  const plan = useTodayPlan();
  const running = useSessionStore((s) => !!s.activeSession);
  const perWeek = useProfileStore((s) => s.profile?.program.perWeek ?? 3);
  const workouts = useWorkoutStore((s) => s.workouts);
  const streak = weekStreak(workouts, perWeek);

  return (
    <Screen
      tabs
      scroll
      footer={
        running ? (
          <StickerButton
            label="Reprendre la séance"
            testID="resume-session"
            haptic="medium"
            onPress={() => router.push('/session')}
          />
        ) : plan ? (
          <StickerButton label="Lancer la séance" testID="start-session" haptic="medium" onPress={() => start(plan)} />
        ) : null
      }
    >
      <FadeIn>
        <ScreenHeader
          eyebrow={formatDay(new Date())}
          title="Aujourd'hui"
          right={streak > 1 ? <Chip tone="sun" label={`${streak} sem. d'affilée`} /> : undefined}
        />
      </FadeIn>
      <FadeIn index={1}>
        <WeekCard />
      </FadeIn>
      {plan ? (
        <FadeIn index={2}>
          <TodayCard plan={plan} running={running} />
        </FadeIn>
      ) : null}
      <FadeIn index={3}>
        <LastWorkout />
      </FadeIn>
    </Screen>
  );
}

function WeekCard() {
  const perWeek = useProfileStore((s) => s.profile?.program.perWeek ?? 3);
  const workouts = useWorkoutStore((s) => s.workouts);
  const done = workoutsThisWeek(workouts).length;
  const left = Math.max(0, perWeek - done);

  return (
    <>
      <SectionTitle title="Cette semaine" first />
      <StickerCard style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
          <Text size={15} weight="bold" style={{ flex: 1 }}>
            {left === 0
              ? 'Objectif de la semaine atteint'
              : `Encore ${left} séance${left > 1 ? 's' : ''} cette semaine`}
          </Text>
          <Chip tone={left === 0 ? 'success' : 'neutral'} label={`${done}/${perWeek}`} />
        </View>
        <WeekStrip days={weekDays(workouts)} />
      </StickerCard>
    </>
  );
}

function TodayCard({ plan, running }: { plan: PlannedDay; running: boolean }) {
  // Le premier mouvement à la barre déjà réglé : c'est lui qu'on dessine
  const featured = plan.lifts.find((l) => l.def.equipment === 'barbell' && l.decision !== 'calibrate');
  const target = featured?.targets[0];
  const perSide = usePerSide(target?.weight ?? 0);
  const sets = plan.lifts.reduce((n, l) => n + l.targets.length, 0);
  const daysOff = Math.max(0, ...plan.lifts.map((l) => (l.decision === 'comeback' ? (l.daysOff ?? 0) : 0)));

  return (
    <>
      <SectionTitle title={running ? 'Séance en cours' : 'Séance du jour'} />
      <StickerCard tone="hero" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <View style={{ position: 'absolute', top: -14, right: 18 }}>
          <Sparkle size={34} />
        </View>
        <Text
          size={38}
          weight="black"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ lineHeight: 44, marginRight: 36 }}
        >
          {plan.name}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
          <Chip label={`${plan.lifts.length} exercices`} />
          <Chip label={`${sets} séries`} />
          <Chip label={`~${plan.minutes} min`} />
        </View>
        {daysOff > 0 ? (
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
            <Text size={14} weight="black">
              Content de te revoir !
            </Text>
            <Text size={14} weight="semibold" style={{ lineHeight: 19 }}>
              Après {breakLabel(daysOff)} de pause, on reprend un peu plus léger. Ça remonte vite.
            </Text>
          </View>
        ) : null}

        {featured && target ? (
          <View
            style={{
              marginTop: space.lg,
              padding: space.md,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              borderWidth: border.base,
              borderColor: colors.ink,
              backgroundColor: colors.card,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text size={14} weight="bold" color={colors.inkMuted}>
                Sur la barre en premier
              </Text>
              <Chip tone="success" label={deltaLabel(featured)} />
            </View>
            <View style={{ height: 96, justifyContent: 'center', marginTop: 4 }}>
              <Barbell perSide={perSide} scale={0.85} barWidth={90} />
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm }}
            >
              <Text size={16} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                {featured.def.name}
              </Text>
              <Text size={22} weight="black">
                {formatKg(target.weight)}
                <Text size={14} weight="bold" color={colors.inkMuted}>
                  {' '}
                  kg × {target.reps}
                </Text>
              </Text>
            </View>
            <Text size={14} color={colors.inkMuted} style={{ marginTop: 2 }}>
              {describeSide(perSide)} de chaque côté
            </Text>
          </View>
        ) : (
          <Text size={15} color={colors.ink} style={{ marginTop: space.md, lineHeight: 21 }}>
            Première séance : tu choisiras ta charge de départ sur chaque exercice, ensuite on calcule tout.
          </Text>
        )}

        <View style={{ marginTop: space.sm }}>
          {plan.lifts.map((lift, i) => (
            <LiftLine key={lift.def.name} lift={lift} index={i} last={i === plan.lifts.length - 1} />
          ))}
        </View>
      </StickerCard>
    </>
  );
}

function LiftLine({ lift, index, last }: { lift: PlannedLift; index: number; last: boolean }) {
  const calibrate = lift.decision === 'calibrate';
  const progress = lift.decision === 'add_weight' || lift.decision === 'add_reps';
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${lift.def.name}, ${calibrate ? 'charge à choisir' : targetLabel(lift.targets)}`}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.line,
      }}
    >
      <Text size={15} weight="black" style={{ width: 18 }}>
        {index + 1}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={16} weight="bold" numberOfLines={1}>
          {lift.def.name}
        </Text>
        <Text size={14} color={colors.inkMuted} numberOfLines={1}>
          {calibrate ? 'Charge à choisir' : targetLabel(lift.targets)}
        </Text>
      </View>
      {progress ? <Chip tone="success" label={deltaLabel(lift)} /> : null}
      <ChevronRight size={18} />
    </PressableScale>
  );
}

function LastWorkout() {
  const last = useWorkoutStore((s) => s.workouts[0]);
  if (!last) return null;
  const sets = last.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
  return (
    <>
      <SectionTitle title="Dernière séance" />
      <StickerCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text size={17} weight="black">
            {last.name}
          </Text>
          <Text size={13} color={colors.inkMuted}>
            {formatShortDay(last.date)} · {sets} séries · {last.duration ?? 0} min
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text size={17} weight="black">
            {formatThousands(tonnage(last))} kg
          </Text>
          <Text size={13} color={colors.inkMuted}>
            soulevés
          </Text>
        </View>
      </StickerCard>
    </>
  );
}
