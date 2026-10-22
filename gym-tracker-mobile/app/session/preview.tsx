import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
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
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
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
    <Screen scroll footer={<Button label="Lancer la séance" haptic="medium" onPress={start} />}>
      <BackButton label="Retour à l'accueil" />
      <ScreenHeader
        eyebrow={`Séance du jour · ~${plan.minutes} min`}
        title={plan.name}
        subtitle="Charges et reps calculées depuis tes dernières séances. Touche un exercice pour le détail."
      />
      <View style={{ gap: 10 }}>
        {plan.lifts.map((lift, i) => (
          <FadeIn key={lift.def.name} index={i + 1}>
            <LiftRow lift={lift} index={i} />
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

function LiftRow({ lift, index }: { lift: PlannedLift; index: number }) {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  const calibrate = lift.decision === 'calibrate';
  const weight = lift.targets[0]?.weight ?? 0;
  const perSide = loadBar(weight, bar, plates).perSide;
  const showPlates = lift.def.equipment === 'barbell' && !calibrate;
  const progress = lift.decision === 'add_weight' || lift.decision === 'add_reps';

  return (
    <PressableScale
      haptic="selection"
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      accessibilityRole="button"
      accessibilityLabel={`${lift.def.name}, ${calibrate ? 'première fois' : targetLabel(lift.targets)}, ${deltaLabel(lift)}`}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size={13} weight="black">
            {index + 1}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text size={16} weight="black" numberOfLines={1}>
            {lift.def.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text size={13} weight="semibold" color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
              {calibrate ? 'Charge à choisir' : targetLabel(lift.targets)}
            </Text>
            {progress ? <Chip tone="go" label={deltaLabel(lift)} /> : null}
          </View>
        </View>
        {showPlates ? (
          <View accessible accessibilityLabel={`Par côté : ${describeSide(perSide)}`}>
            <MiniPlates perSide={perSide} />
          </View>
        ) : (
          <Chip label={calibrate ? 'Régler' : EQUIPMENT_LABEL[lift.def.equipment]} />
        )}
      </Card>
    </PressableScale>
  );
}
