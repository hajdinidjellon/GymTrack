import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { countFr, formatDay, formatShortDay, formatThousands } from '@/domain/format';
import { describeSide, formatKg } from '@/domain/plates';
import {
  breakLabel,
  deltaLabel,
  nextDay,
  planDay,
  lastTimeLabel,
  targetLabel,
  targetLoad,
  tonnage,
  toActiveExercises,
  type PlannedDay,
  type PlannedLift,
} from '@/domain/sessionBuilder';
import { isProgress } from '@/domain/progression';
import { weekDays } from '@/domain/stats';
import { weekStreak, workoutsThisWeek } from '@/domain/week';
import { programDays, type ProgramDay } from '@/domain/programs';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Chip, IndexBadge } from '@/components/ui/Chip';
import { Sparkle } from '@/components/ui/Sparkle';
import { FadeIn } from '@/components/ui/FadeIn';
import { buzz, PressableScale } from '@/components/ui/PressableScale';
import { ChevronRight } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { WeekStrip } from '@/components/stats/WeekStrip';
import { RunningCard } from '@/components/session/RunningCard';

function start(plan: PlannedDay) {
  useSessionStore.getState().startSession(plan.name, toActiveExercises(plan));
  router.push('/session');
}

export default function Today() {
  const ctx = useBuildContext();
  const workouts = useWorkoutStore((s) => s.workouts);
  // A day picked by hand holds until the next saved session, then the program leads again
  const [choice, setChoice] = useState<{ name: string; after: number } | null>(null);
  const dayName = choice?.after === workouts.length ? choice.name : null;
  const { days, today, plan } = useMemo(() => {
    if (!ctx) return { days: [], today: null, plan: null };
    const list = programDays(ctx.profile.program.split, ctx.settings.customDays, ctx.settings.customExercises);
    const next = nextDay(ctx);
    const day = list.find((d) => d.name === dayName) ?? next;
    return { days: list, today: next, plan: planDay(day, ctx) };
  }, [ctx, dayName]);
  const active = useSessionStore((s) => s.activeSession);
  const running = !!active;
  const perWeek = useProfileStore((s) => s.profile?.program.perWeek ?? 3);
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
        ) : plan && plan.lifts.length > 0 ? (
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
      {active ? (
        <FadeIn index={2}>
          <RunningCard session={active} />
        </FadeIn>
      ) : plan ? (
        <FadeIn index={2}>
          <TodayCard
            plan={plan}
            days={days}
            today={today?.name ?? plan.name}
            onChoose={(name) => setChoice({ name, after: workouts.length })}
          />
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

interface TodayProps {
  plan: PlannedDay;
  days: ProgramDay[];
  /** The day the program plans next. */
  today: string;
  onChoose: (name: string) => void;
}

function TodayCard({ plan, days, today, onChoose }: TodayProps) {
  // Le premier mouvement à la barre déjà réglé : c'est lui qu'on dessine
  const featured = plan.lifts.find((l) => l.def.equipment === 'barbell' && l.decision !== 'calibrate');
  const target = featured?.targets[0];
  const perSide = usePerSide(target?.weight ?? 0);
  const sets = plan.lifts.reduce((n, l) => n + l.targets.length, 0);
  const daysOff = Math.max(0, ...plan.lifts.map((l) => (l.decision === 'comeback' ? (l.daysOff ?? 0) : 0)));

  return (
    <>
      <SectionTitle title={plan.name === today ? 'Séance du jour' : 'Séance choisie'} />
      {days.length > 1 ? <DayPicker days={days} current={plan.name} today={today} onChoose={onChoose} /> : null}
      <StickerCard tone="hero" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <View style={{ position: 'absolute', top: 14, right: 16 }}>
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
          <Chip label={countFr(plan.lifts.length, 'exercice')} />
          <Chip label={countFr(sets, 'série')} />
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
              <Chip tone={isProgress(featured.decision) ? 'success' : 'neutral'} label={deltaLabel(featured)} />
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
              {perSide.length ? `${describeSide(perSide)} de chaque côté` : 'Barre à vide'}
            </Text>
          </View>
        ) : plan.lifts.length === 0 ? (
          <View style={{ marginTop: space.md, gap: space.sm }}>
            <Text size={15} color={colors.ink} style={{ lineHeight: 21 }}>
              Aucun exercice dans cette séance pour l'instant.
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/days/[name]', params: { name: plan.name } })}
              accessibilityRole="button"
              hitSlop={8}
              style={{ alignSelf: 'flex-start', paddingBottom: space.sm }}
            >
              <Text size={15} weight="black" style={{ textDecorationLine: 'underline' }}>
                Ajouter des exercices
              </Text>
            </Pressable>
          </View>
        ) : plan.lifts.every((l) => l.decision === 'calibrate') ? (
          <Text size={15} color={colors.ink} style={{ marginTop: space.md, lineHeight: 21 }}>
            Première séance : tu choisiras ta charge de départ sur chaque exercice, ensuite on calcule tout.
          </Text>
        ) : null}

        <View style={{ marginTop: space.sm }}>
          {plan.lifts.map((lift, i) => (
            <LiftLine key={lift.def.name} lift={lift} index={i} last={i === plan.lifts.length - 1} />
          ))}
        </View>
      </StickerCard>
    </>
  );
}

/** One exercise: its name, today's target in bold with what changed, last time underneath. */
function LiftLine({ lift, index, last }: { lift: PlannedLift; index: number; last: boolean }) {
  const calibrate = lift.decision === 'calibrate';
  const progress = isProgress(lift.decision);
  const sets = countFr(lift.targets.length, 'série');
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${lift.def.name}, ${calibrate ? 'charge à choisir' : targetLabel(lift.targets)}`}
      style={{
        paddingVertical: space.md + 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.line,
      }}
    >
      <IndexBadge value={index + 1} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text size={17} weight="black" numberOfLines={2} style={{ lineHeight: 21 }}>
          {lift.def.name}
        </Text>
        {/* Today's target, then what changed: the badge sits right after it, not at the edge */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}>
          <Text size={16} weight="black">
            {calibrate ? 'Charge à choisir' : targetLoad(lift.targets)}
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted}>
            {sets}
          </Text>
          {progress ? <Chip tone="success" label={deltaLabel(lift)} /> : null}
        </View>
        {lift.last.length ? (
          <Text size={13} color={colors.inkMuted} numberOfLines={1}>
            Dernière fois : {lastTimeLabel(lift.last)}
          </Text>
        ) : null}
      </View>
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
            {formatShortDay(last.date)} · {countFr(sets, 'série')} · {last.duration ?? 0} min
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

/** "Pas envie de ça ?": every day of the program side by side, one tap to do it today instead. */
function DayPicker({
  days,
  current,
  today,
  onChoose,
}: {
  days: ProgramDay[];
  current: string;
  today: string;
  onChoose: (name: string) => void;
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text size={14} weight="bold" color={colors.inkMuted}>
        Envie d'autre chose ? Choisis ta séance
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {days.map((d) => {
          const on = d.name === current;
          const planned = d.name === today;
          return (
            <Pressable
              key={d.name}
              onPress={() => {
                buzz('selection');
                onChoose(d.name);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Séance ${d.name}${planned ? ', prévue aujourd’hui' : ''}`}
              style={{
                // Equal widths on one row; a long program wraps onto a second one
                flexGrow: 1,
                flexBasis: days.length > 3 ? '45%' : 0,
                minHeight: 56,
                paddingHorizontal: 10,
                borderRadius: radius.row,
                borderWidth: on ? border.strong : border.base,
                borderColor: on ? colors.ink : colors.line,
                backgroundColor: on ? colors.coralSoft : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                ...(on ? hardShadow(2) : {}),
              }}
            >
              <Text size={16} weight="black" numberOfLines={1} color={on ? colors.ink : colors.inkMuted}>
                {d.name}
              </Text>
              {planned ? (
                <Text size={12} weight="bold" color={colors.inkMuted}>
                  prévue
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
