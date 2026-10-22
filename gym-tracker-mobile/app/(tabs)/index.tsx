import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { formatDay, formatShortDay, formatThousands } from '@/domain/format';
import { describeSide, formatKg } from '@/domain/plates';
import { deltaLabel, tonnage, toActiveExercises, type PlannedDay } from '@/domain/sessionBuilder';
import { weekStreak, workoutsThisWeek } from '@/domain/week';
import { useTodayPlan } from '@/hooks/useTodayPlan';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChevronRight } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { WeekDiscs } from '@/components/disc/WeekDiscs';

function start(plan: PlannedDay) {
  useSessionStore.getState().startSession(plan.name, toActiveExercises(plan));
  router.push('/session');
}

export default function Today() {
  const plan = useTodayPlan();
  const running = useSessionStore((s) => s.activeSession);

  return (
    <Screen
      tabs
      scroll
      footer={
        running ? (
          <Button label="Reprendre la séance" testID="resume-session" onPress={() => router.push('/session')} />
        ) : plan ? (
          <Button label="Lancer la séance" testID="start-session" onPress={() => start(plan)} />
        ) : null
      }
    >
      <ScreenHeader eyebrow={formatDay(new Date())} title="Aujourd'hui" />
      {plan ? <TodayCard plan={plan} running={!!running} /> : null}
      <WeekBlock />
      <LastWorkout />
    </Screen>
  );
}

function TodayCard({ plan, running }: { plan: PlannedDay; running: boolean }) {
  // Le premier mouvement à la barre déjà réglé : c'est lui qu'on dessine
  const featured = plan.lifts.find((l) => l.def.equipment === 'barbell' && l.decision !== 'calibrate');
  const target = featured?.targets[0];
  const perSide = usePerSide(target?.weight ?? 0);

  return (
    <>
      <SectionTitle
        title={running ? 'Séance en cours' : 'Séance du jour'}
        first
        right={<Meta>{`~${plan.minutes} min`}</Meta>}
      />
      <Card style={{ paddingTop: 18, paddingBottom: 6 }}>
        <Text size={48} weight="black" numberOfLines={1} adjustsFontSizeToFit style={{ lineHeight: 52 }}>
          {plan.name}
        </Text>
        <Text size={16} color={colors.muted}>
          {plan.lifts.length} exercices · tout est calculé pour toi
        </Text>

        {featured && target ? (
          <View style={{ marginTop: space.lg }}>
            <Text size={15} weight="semibold" color={colors.muted}>
              Sur la barre en premier
            </Text>
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}
            >
              <Text size={20} weight="black" numberOfLines={1} style={{ flex: 1 }}>
                {featured.def.name}
              </Text>
              <Text size={15} weight="black">
                {deltaLabel(featured)}
              </Text>
            </View>
            <View style={{ marginTop: space.sm, height: 112, justifyContent: 'center' }}>
              <Barbell perSide={perSide} barWidth={110} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text size={36} weight="black">
                {formatKg(target.weight)}{' '}
                <Text size={18} weight="black">
                  kg × {target.reps}
                </Text>
              </Text>
              <Text size={15} weight="semibold" color={colors.muted}>
                {describeSide(perSide)} / côté
              </Text>
            </View>
          </View>
        ) : (
          <Text size={17} color={colors.muted} style={{ marginTop: space.md, lineHeight: 23 }}>
            Première séance : tu choisiras ta charge de départ sur chaque exercice, ensuite on calcule tout.
          </Text>
        )}

        <Pressable
          onPress={() => router.push('/session/preview')}
          accessibilityRole="button"
          accessibilityLabel={`Voir les ${plan.lifts.length} exercices`}
          style={({ pressed }) => ({
            marginTop: space.md,
            height: 52,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text size={17} weight="bold">
            Voir les {plan.lifts.length} exercices
          </Text>
          <ChevronRight size={20} />
        </Pressable>
      </Card>
    </>
  );
}

function WeekBlock() {
  const perWeek = useProfileStore((s) => s.profile?.program.perWeek ?? 3);
  const workouts = useWorkoutStore((s) => s.workouts);
  const done = workoutsThisWeek(workouts).length;
  const streak = weekStreak(workouts, perWeek);

  const line =
    done >= perWeek
      ? 'Objectif de la semaine atteint.'
      : `Encore ${perWeek - done} séance${perWeek - done > 1 ? 's' : ''} pour l'objectif.`;

  return (
    <>
      <SectionTitle title="Cette semaine" right={<Meta>{`${done} / ${perWeek}`}</Meta>} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Text size={17} weight="bold">
            {line}
          </Text>
          {streak > 1 ? (
            <Text size={15} color={colors.muted} style={{ marginTop: 2 }}>
              {streak} semaines d'affilée à l'objectif
            </Text>
          ) : null}
        </View>
        <WeekDiscs done={done} planned={perWeek} />
      </Card>
    </>
  );
}

function LastWorkout() {
  const last = useWorkoutStore((s) => s.workouts[0]);
  if (!last) return null;
  return (
    <>
      <SectionTitle title="Dernière séance" />
      <View
        style={{
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text size={18} weight="black">
            {last.name}
          </Text>
          <Text size={15} color={colors.muted}>
            {formatShortDay(last.date)}
          </Text>
        </View>
        <Text size={18} weight="black">
          {formatThousands(tonnage(last))} kg
        </Text>
      </View>
    </>
  );
}

function Meta({ children }: { children: string }) {
  return (
    <Text size={15} weight="bold" color={colors.muted}>
      {children}
    </Text>
  );
}
