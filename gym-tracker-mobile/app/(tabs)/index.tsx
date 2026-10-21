import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { useTodayPlan } from '@/hooks/useTodayPlan';
import { formatDay } from '@/lib/format';
import { describeSide, formatKg } from '@/lib/plates';
import { deltaLabel } from '@/lib/sessionBuilder';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore, workoutsThisWeek } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { WeekDiscs } from '@/components/disc/WeekDiscs';

export default function Today() {
  const plan = useTodayPlan();
  const perWeek = useProfileStore((s) => s.profile?.program.perWeek ?? 3);
  const doneThisWeek = useWorkoutStore((s) => workoutsThisWeek(s.workouts).length);
  const sessionRunning = useSessionStore((s) => !!s.activeSession);

  // La barre mise en avant : le premier mouvement à la barre déjà réglé
  const featured =
    plan?.lifts.find((l) => l.def.equipment === 'barbell' && l.decision !== 'calibrate') ?? plan?.lifts[0];
  const target = featured?.targets[0];
  const perSide = usePerSide(target?.weight ?? 0);

  return (
    <Screen
      tabs
      scroll
      footer={
        sessionRunning ? (
          <Button label="Reprendre la séance" onPress={() => router.push('/session')} />
        ) : (
          <Button label="Charger la barre" onPress={() => router.push('/session/preview')} />
        )
      }
    >
      <Text size={15} weight="semibold" color={colors.muted} style={{ marginTop: 12 }}>{formatDay(new Date())}</Text>
      <Text size={96} weight="black" numberOfLines={1} adjustsFontSizeToFit style={{ lineHeight: 92, marginTop: 4 }}>
        {plan?.name ?? ''}
      </Text>
      <Text size={18} color={colors.muted} style={{ marginTop: 10 }}>
        {plan ? `${plan.lifts.length} exercices · ${plan.minutes} min` : ''}
      </Text>

      {featured && target ? (
        <Card style={{ marginTop: 24, paddingTop: 20, paddingBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={16} weight="semibold" color={colors.muted}>Sur la barre aujourd'hui</Text>
            <Text size={15} weight="black">{deltaLabel(featured)}</Text>
          </View>
          <Text size={22} weight="black" style={{ marginTop: 2 }}>{featured.def.name}</Text>
          {target.weight > 0 ? (
            <>
              <View style={{ marginTop: 14, height: 130, justifyContent: 'center' }}>
                <Barbell perSide={perSide} scale={1.15} barWidth={116} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
                <Text size={48} weight="black">
                  {formatKg(target.weight)} <Text size={20} weight="black">kg × {target.reps}</Text>
                </Text>
                {featured.def.equipment === 'barbell' ? (
                  <Text size={15} weight="semibold" color={colors.muted}>{describeSide(perSide)} / côté</Text>
                ) : null}
              </View>
            </>
          ) : (
            <Text size={18} color={colors.muted} style={{ marginTop: 12 }}>
              Première séance : tu choisiras ta charge de départ, ensuite on calcule tout.
            </Text>
          )}
        </Card>
      ) : null}

      <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={17} weight="semibold">Cette semaine</Text>
        <WeekDiscs done={doneThisWeek} planned={perWeek} />
      </View>
    </Screen>
  );
}
