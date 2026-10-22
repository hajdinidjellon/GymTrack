import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius } from '@/constants/theme';
import { useTodayPlan } from '@/hooks/useTodayPlan';
import { describeSide, loadBar } from '@/domain/plates';
import { deltaLabel, targetLabel, toActiveExercises, type PlannedLift } from '@/domain/sessionBuilder';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Pill } from '@/components/ui/Pill';
import { MiniPlates } from '@/components/disc/Barbell';

const EQUIPMENT_LABEL = { barbell: 'Barre', dumbbell: 'Haltères', machine: 'Machine', bodyweight: 'PDC' };

export default function Preview() {
  const plan = useTodayPlan();
  if (!plan) return null;

  const start = () => {
    useSessionStore.getState().startSession(plan.name, toActiveExercises(plan));
    router.replace('/session');
  };

  return (
    <Screen scroll footer={<Button label="Lancer la séance" onPress={start} />}>
      <BackButton label="Retour à l'accueil" />
      <ScreenHeader
        eyebrow={`Séance du jour · ~${plan.minutes} min`}
        title={plan.name}
        subtitle="Charges et reps calculées depuis tes dernières séances. Touche un exercice pour le détail."
      />
      <View style={{ gap: 10 }}>
        {plan.lifts.map((lift) => (
          <LiftRow key={lift.def.name} lift={lift} />
        ))}
      </View>
    </Screen>
  );
}

function LiftRow({ lift }: { lift: PlannedLift }) {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  const calibrate = lift.decision === 'calibrate';
  const weight = lift.targets[0]?.weight ?? 0;
  const perSide = loadBar(weight, bar, plates).perSide;
  const showPlates = lift.def.equipment === 'barbell' && !calibrate;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      accessibilityRole="button"
      accessibilityLabel={`${lift.def.name}, ${calibrate ? 'première fois' : targetLabel(lift.targets)}, ${deltaLabel(lift)}`}
      style={({ pressed }) => ({
        height: 84,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        paddingLeft: 20,
        paddingRight: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text size={19} weight="black" numberOfLines={1}>
          {lift.def.name}
        </Text>
        <Text size={16} weight="semibold" color={colors.muted} numberOfLines={1}>
          {calibrate ? 'Première fois' : targetLabel(lift.targets)} ·{' '}
          <Text size={16} weight="black">
            {deltaLabel(lift)}
          </Text>
        </Text>
      </View>
      {showPlates ? (
        <View accessible accessibilityLabel={`Par côté : ${describeSide(perSide)}`}>
          <MiniPlates perSide={perSide} />
        </View>
      ) : (
        <Pill label={calibrate ? 'Régler' : EQUIPMENT_LABEL[lift.def.equipment]} />
      )}
    </Pressable>
  );
}
