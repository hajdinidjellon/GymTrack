import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { formatDay, formatShortDay, formatThousands } from '@/domain/format';
import { setsDone } from '@/domain/history';
import { describeSide, formatKg } from '@/domain/plates';
import {
  breakLabel,
  deltaLabel,
  nextDay,
  planDay,
  lastTimeLabel,
  targetLabel,
  targetLoad,
  todayStatus,
  tonnage,
  toActiveExercises,
  weekOf,
  type PlannedDay,
  type PlannedLift,
} from '@/domain/sessionBuilder';
import { isProgress } from '@/domain/progression';
import { weekDays } from '@/domain/stats';
import { weekStreak, workoutsThisWeek } from '@/domain/week';
import { type ChoosableDay, choosableDays, getSplit, hasExercises } from '@/domain/programs';
import { latestWorkoutDate, suggestedSplit, SWITCH_AFTER } from '@/domain/programSwitch';
import { nextScheduled, whenLabel } from '@/domain/schedule';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { useLocale } from '@/hooks/useLocale';
import { dayName, exerciseName, t } from '@/i18n';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
  useLocale();
  const ctx = useBuildContext();
  const workouts = useWorkoutStore((s) => s.workouts);
  // A day picked by hand holds until the next saved session, then the program leads again
  const [choice, setChoice] = useState<{ name: string; after: number } | null>(null);
  const picked = choice?.after === workouts.length ? choice.name : null;
  const { days, today, plan, off } = useMemo(() => {
    if (!ctx) return { days: [], today: null, plan: null, off: null };
    const list = choosableDays(
      ctx.profile.program.split,
      ctx.settings.customDays,
      ctx.settings.customExercises,
      ctx.settings.ownDays,
    ).filter(hasExercises);
    const next = nextDay(ctx);
    const day = list.find((d) => d.name === picked) ?? next;
    const status = todayStatus(ctx);
    const resting = status.kind === 'rest' || status.kind === 'done';
    return {
      days: list,
      // Un jour sans séance prévue, aucune n'est « du jour »
      today: resting ? null : next,
      plan: planDay(day, ctx),
      off: resting && !picked ? status.kind : null,
    };
  }, [ctx, picked]);
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
            label={t('home.resume')}
            testID="resume-session"
            haptic="medium"
            onPress={() => router.push('/session')}
          />
        ) : plan && !off && plan.lifts.length > 0 ? (
          <StickerButton label={t('home.start')} testID="start-session" haptic="medium" onPress={() => start(plan)} />
        ) : null
      }
    >
      <FadeIn>
        <ScreenHeader
          eyebrow={formatDay(new Date())}
          title={t('home.title')}
          right={streak > 1 ? <Chip tone="sun" label={t('home.streak', { count: streak })} /> : undefined}
        />
      </FadeIn>
      <FadeIn index={1}>
        <WeekCard />
      </FadeIn>
      {running ? null : <SwitchCard />}
      {active ? (
        <FadeIn index={2}>
          <RunningCard session={active} />
        </FadeIn>
      ) : off ? (
        <FadeIn index={2}>
          <RestCard
            done={off === 'done'}
            days={days}
            onChoose={(name) => setChoice({ name, after: workouts.length })}
          />
        </FadeIn>
      ) : plan ? (
        <FadeIn index={2}>
          <TodayCard
            plan={plan}
            days={days}
            today={today?.name ?? null}
            firstTime={workouts.length === 0}
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
      <SectionTitle title={t('home.week.title')} first />
      <StickerCard style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
          <Text size={15} weight="bold" style={{ flex: 1 }}>
            {left === 0 ? t('home.week.reached') : t('home.week.left', { count: left })}
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
  days: ChoosableDay[];
  /** The day planned today, none on a day off. */
  today: string | null;
  /** No session yet: the program decides, no choice to make. */
  firstTime?: boolean;
  onChoose: (name: string) => void;
}

function TodayCard({ plan, days, today, firstTime, onChoose }: TodayProps) {
  // Le premier mouvement à la barre déjà réglé : c'est lui qu'on dessine
  const featured = plan.lifts.find((l) => l.def.equipment === 'barbell' && l.decision !== 'calibrate');
  const target = featured?.targets[0];
  const perSide = usePerSide(target?.weight ?? 0);
  const sets = plan.lifts.reduce((n, l) => n + l.targets.length, 0);
  const daysOff = Math.max(0, ...plan.lifts.map((l) => (l.decision === 'comeback' ? (l.daysOff ?? 0) : 0)));

  return (
    <>
      <SectionTitle title={plan.name === today ? t('home.today.planned') : t('home.today.chosen')} />
      {days.length > 1 && !firstTime ? (
        <DayPicker days={days} current={plan.name} today={today} onChoose={onChoose} />
      ) : null}
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
          {dayName(plan.name)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
          <Chip label={t('common.exercises', { count: plan.lifts.length })} />
          <Chip label={t('common.sets', { count: sets })} />
          <Chip label={t('home.today.minutes', { n: plan.minutes })} />
        </View>
        {daysOff > 0 ? (
          <View
            style={{
              marginTop: space.md,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderColor: colors.frame,
              backgroundColor: colors.sunPanel,
            }}
          >
            <Text size={14} weight="black" color={colors.onSunPanel}>
              {t('home.today.welcomeBack')}
            </Text>
            <Text size={14} weight="semibold" style={{ lineHeight: 19 }}>
              {t('home.today.comeback', { pause: breakLabel(daysOff) })}
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
              borderColor: colors.frame,
              backgroundColor: colors.inset,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text size={14} weight="bold" color={colors.inkMuted}>
                {t('home.today.firstOnBar')}
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
                {exerciseName(featured.def.name)}
              </Text>
              <Text size={22} weight="black">
                {formatKg(target.weight)}
                <Text size={14} weight="bold" color={colors.inkMuted}>
                  {' '}
                  {t('home.today.kgTimesReps', { reps: target.reps })}
                </Text>
              </Text>
            </View>
            <Text size={14} color={colors.inkMuted} style={{ marginTop: 2 }}>
              {perSide.length ? t('home.today.perSide', { plates: describeSide(perSide) }) : t('home.today.emptyBar')}
            </Text>
          </View>
        ) : plan.lifts.length === 0 ? (
          <View style={{ marginTop: space.md, gap: space.sm }}>
            <Text size={15} color={colors.ink} style={{ lineHeight: 21 }}>
              {t('home.today.noExercises')}
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/days/[name]', params: { name: plan.name } })}
              accessibilityRole="button"
              hitSlop={8}
              style={{ alignSelf: 'flex-start', paddingBottom: space.sm }}
            >
              <Text size={15} weight="black" style={{ textDecorationLine: 'underline' }}>
                {t('home.today.addExercises')}
              </Text>
            </Pressable>
          </View>
        ) : plan.lifts.every((l) => l.decision === 'calibrate') ? (
          <Text size={15} color={colors.ink} style={{ marginTop: space.md, lineHeight: 21 }}>
            {t('home.today.firstSession')}
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
  const sets = t('common.sets', { count: lift.targets.length });
  const name = exerciseName(lift.def.name);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={
        calibrate
          ? t('home.lift.a11yToChoose', { name })
          : t('home.lift.a11y', { name, target: targetLabel(lift.targets, lift.def.timed) })
      }
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
          {name}
        </Text>
        {/* Today's target, then what changed: the badge sits right after it, not at the edge */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}>
          <Text size={16} weight="black">
            {calibrate ? t('home.lift.toChoose') : targetLoad(lift.targets, lift.def.timed)}
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted}>
            {sets}
          </Text>
          {progress ? <Chip tone="success" label={deltaLabel(lift)} /> : null}
        </View>
        {lift.last.length ? (
          <Text size={13} color={colors.inkMuted} numberOfLines={1}>
            {t('home.lift.lastTime', { last: lastTimeLabel(lift.last, lift.def.timed) })}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} />
    </PressableScale>
  );
}

function LastWorkout() {
  const last = useWorkoutStore((s) => s.workouts[0]);
  const factor = useLoadFactor();
  if (!last) return null;
  const sets = setsDone(last);
  const date = formatShortDay(last.date);
  return (
    <>
      <SectionTitle
        title={t('home.last.title')}
        right={
          <Pressable onPress={() => router.push('/history')} accessibilityRole="button" hitSlop={8}>
            <Text size={14} weight="black" style={{ textDecorationLine: 'underline' }}>
              {t('history.homeLink')}
            </Text>
          </Pressable>
        }
      />
      <PressableScale
        haptic="selection"
        onPress={() => router.push({ pathname: '/history/[id]', params: { id: last.id } })}
        accessibilityRole="button"
        accessibilityLabel={t('history.homeA11y', { name: dayName(last.name), date })}
      >
        <StickerCard style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={17} weight="black">
              {dayName(last.name)}
            </Text>
            <Text size={13} color={colors.inkMuted}>
              {t('home.last.meta', {
                date,
                sets: t('common.sets', { count: sets }),
                minutes: last.duration ?? 0,
              })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text size={17} weight="black">
              {formatThousands(tonnage(last, factor))} {t('common.kg')}
            </Text>
            <Text size={13} color={colors.inkMuted}>
              {t('home.last.lifted')}
            </Text>
          </View>
          <ChevronRight size={20} />
        </StickerCard>
      </PressableScale>
    </>
  );
}

/** A day off in the user's week, or the session already done today. Training anyway is one tap away. */
function RestCard({ done, days, onChoose }: { done: boolean; days: ChoosableDay[]; onChoose: (name: string) => void }) {
  const ctx = useBuildContext();
  const now = new Date();
  const week = ctx ? weekOf(ctx) : null;
  const next = week ? nextScheduled(week.schedule, now, week.canDo) : null;

  return (
    <>
      <SectionTitle title={t('home.today.planned')} />
      <StickerCard tone="hero" style={{ gap: space.sm }}>
        <Text size={34} weight="black" style={{ lineHeight: 40 }}>
          {done ? t('home.rest.done') : t('home.rest.off')}
        </Text>
        <Text size={16} weight="semibold" color={colors.inkMuted} style={{ lineHeight: 22 }}>
          {done ? t('home.rest.wellDone') : t('home.rest.recovering')}
          {next ? ` ${t('home.rest.next', { name: dayName(next.name), when: whenLabel(next.inDays, now) })}` : ''}
        </Text>
      </StickerCard>
      <View style={{ marginTop: space.md }}>
        <DayPicker days={days} current={null} today={null} label={t('home.rest.pickAnyway')} onChoose={onChoose} />
      </View>
    </>
  );
}

/** "Pas envie de ça ?": every day of the program side by side, one tap to do it today instead. */
function DayPicker({
  days,
  current,
  today,
  label = t('home.picker.label'),
  onChoose,
}: {
  days: ChoosableDay[];
  current: string | null;
  today: string | null;
  label?: string;
  onChoose: (name: string) => void;
}) {
  const program = days.filter((d) => !d.extra);
  const extras = days.filter((d) => d.extra);
  // The other programs' days wait behind one link, unless one is already picked
  const [showExtras, setShowExtras] = useState(false);
  const extrasOpen = showExtras || extras.some((d) => d.name === current);
  return (
    <View style={{ marginBottom: space.md }}>
      <Text size={14} weight="bold" color={colors.inkMuted}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {program.map((d) => {
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
              accessibilityLabel={t(planned ? 'home.picker.a11yPlanned' : 'home.picker.a11y', {
                name: dayName(d.name),
              })}
              style={{
                // Equal widths on one row; a long program wraps onto a second one
                flexGrow: 1,
                flexBasis: program.length > 3 ? '45%' : 0,
                minHeight: 56,
                paddingHorizontal: 10,
                borderRadius: radius.row,
                borderWidth: on ? border.strong : border.base,
                borderColor: on ? colors.outlineStrong : colors.line,
                backgroundColor: on ? colors.coralSoft : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                ...(on ? hardShadow(2) : {}),
              }}
            >
              <Text size={16} weight="black" numberOfLines={1} color={on ? colors.ink : colors.inkMuted}>
                {dayName(d.name)}
              </Text>
              {planned ? (
                <Text size={12} weight="bold" color={colors.inkMuted}>
                  {t('home.picker.planned')}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {extras.length && !extrasOpen ? (
        <Pressable
          onPress={() => setShowExtras(true)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        >
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            {t('home.picker.extraLink')}
          </Text>
        </Pressable>
      ) : null}
      {extras.length && extrasOpen ? (
        <>
          <Text size={13} weight="bold" color={colors.inkMuted} style={{ marginTop: space.md }}>
            {t('home.picker.extraLabel')}
          </Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {extras.map((d) => {
              const on = d.name === current;
              return (
                <Pressable
                  key={d.name}
                  onPress={() => {
                    buzz('selection');
                    onChoose(d.name);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t('home.picker.a11yExtra', { name: dayName(d.name) })}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 16,
                    borderRadius: radius.pill,
                    borderWidth: on ? border.strong : border.base,
                    // Hors programme : en pointillés tant qu'on ne l'a pas choisie
                    borderStyle: on ? 'solid' : 'dashed',
                    borderColor: on ? colors.outlineStrong : colors.line,
                    backgroundColor: on ? colors.coralSoft : 'transparent',
                    justifyContent: 'center',
                    ...(on ? hardShadow(2) : {}),
                  }}
                >
                  <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                    {dayName(d.name)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

/**
 * Several sessions in a row from another program: the user changed, the app
 * offers to follow. "Keep" stays quiet until it goes on.
 */
function SwitchCard() {
  const profile = useProfileStore((s) => s.profile);
  const workouts = useWorkoutStore((s) => s.workouts);
  const dismissed = useSettingsStore((s) => s.settings.programSwitchDismissed);
  const current = profile?.program.split;
  const next = current ? suggestedSplit(workouts, current, dismissed) : null;
  if (!current || !next) return null;
  const split = getSplit(next).title;

  return (
    <FadeIn index={2}>
      <StickerCard tone="sun" style={{ gap: space.sm, marginBottom: space.lg }}>
        <Text size={20} weight="black">
          {t('home.switch.title')}
        </Text>
        <Text size={15} weight="semibold" style={{ lineHeight: 21 }}>
          {t('home.switch.body', { count: SWITCH_AFTER, split })}
        </Text>
        <View style={{ gap: space.sm, marginTop: space.xs }}>
          <StickerButton
            label={t('home.switch.yes', { split })}
            variant="secondary"
            onPress={() => router.push({ pathname: '/(onboarding)/program', params: { edit: '1', split: next } })}
          />
          <StickerButton
            label={t('home.switch.no', { split: getSplit(current).title })}
            variant="ghost"
            onPress={() =>
              useSettingsStore.getState().updateSettings({ programSwitchDismissed: latestWorkoutDate(workouts) })
            }
          />
        </View>
      </StickerCard>
    </FadeIn>
  );
}
