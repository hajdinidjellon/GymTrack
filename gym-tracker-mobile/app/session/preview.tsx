import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { describeSide, loadBar } from '@/domain/plates';
import { programDays } from '@/domain/programs';
import {
  deltaLabel,
  nextDay,
  planDay,
  targetLabel,
  toActiveExercises,
  type PlannedLift,
} from '@/domain/sessionBuilder';
import { isProgress } from '@/domain/progression';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Chip, IndexBadge } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiniPlates } from '@/components/disc/Barbell';
import { DayExercisesEditor } from '@/components/program/DayExercisesEditor';

const EQUIPMENT_LABEL = { barbell: 'Barre', dumbbell: 'Haltères', machine: 'Machine', bodyweight: 'PDC' };

export default function Preview() {
  const ctx = useBuildContext();
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const [dayName, setDayName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const splitId = ctx?.profile.program.split;
  const days = splitId ? programDays(splitId, customDays) : [];
  const today = ctx ? nextDay(ctx) : null;
  const day = days.find((d) => d.name === dayName) ?? today;
  const plan = ctx && day ? planDay(day, ctx) : null;
  if (!plan || !splitId || !today || !day) return null;

  const start = () => {
    useSessionStore.getState().startSession(plan.name, toActiveExercises(plan));
    router.replace('/session');
  };

  return (
    <Screen
      scroll
      scrollEnabled={!dragging}
      footer={
        <StickerButton label="Lancer la séance" haptic="medium" disabled={plan.lifts.length === 0} onPress={start} />
      }
    >
      <BackButton label="Retour à l'accueil" />
      <ScreenHeader
        eyebrow={`${plan.name === today.name ? 'Séance du jour' : 'Séance choisie'} · ~${plan.minutes} min`}
        title={plan.name}
        subtitle="Charges et reps calculées depuis tes dernières séances. Touche un exercice pour le détail."
      />

      <Text size={14} weight="bold" color={colors.inkMuted}>
        Envie d'une autre séance ?
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.gutter, marginTop: 8, marginBottom: space.lg, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8 }}
      >
        {days.map((d) => {
          const on = d.name === plan.name;
          return (
            <Pressable
              key={d.name}
              onPress={() => setDayName(d.name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Séance ${d.name}${d.name === today.name ? ', prévue aujourd’hui' : ''}`}
              style={{
                height: 44,
                paddingHorizontal: 18,
                borderRadius: radius.pill,
                borderWidth: on ? border.strong : border.base,
                borderColor: colors.ink,
                backgroundColor: on ? colors.coralSoft : colors.card,
                justifyContent: 'center',
              }}
            >
              <Text size={16} weight={on ? 'black' : 'titleMedium'}>
                {d.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <DayExercisesEditor
        split={splitId}
        day={day}
        items={plan.lifts}
        keyOf={(lift) => lift.def.name}
        onDragChange={setDragging}
        renderRow={(lift, i, remove) => (
          <FadeIn index={i + 1}>
            <LiftRow lift={lift} index={i} onRemove={remove} />
          </FadeIn>
        )}
      />
    </Screen>
  );
}

function LiftRow({ lift, index, onRemove }: { lift: PlannedLift; index: number; onRemove: () => void }) {
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  const calibrate = lift.decision === 'calibrate';
  const weight = lift.targets[0]?.weight ?? 0;
  const perSide = loadBar(weight, bar, plates).perSide;
  const showPlates = lift.def.equipment === 'barbell' && !calibrate;
  const progress = isProgress(lift.decision);

  return (
    <PressableScale
      haptic="selection"
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: lift.def.name } })}
      accessibilityRole="button"
      accessibilityLabel={`${lift.def.name}, ${calibrate ? 'première fois' : targetLabel(lift.targets)}, ${deltaLabel(lift)}`}
    >
      <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IndexBadge value={index + 1} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text size={16} weight="black" numberOfLines={1}>
            {lift.def.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text size={14} weight="semibold" color={colors.inkMuted} numberOfLines={1} style={{ flexShrink: 1 }}>
              {calibrate ? 'Charge à choisir' : targetLabel(lift.targets)}
            </Text>
            {progress ? <Chip tone="success" label={deltaLabel(lift)} /> : null}
          </View>
        </View>
        {showPlates ? (
          <View accessible accessibilityLabel={`Par côté : ${describeSide(perSide)}`}>
            <MiniPlates perSide={perSide} />
          </View>
        ) : (
          <Chip label={calibrate ? 'Régler' : EQUIPMENT_LABEL[lift.def.equipment]} />
        )}
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${lift.def.name}`}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: pressed ? colors.coralSoft : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={14} weight="black">
            ✕
          </Text>
        </Pressable>
      </StickerCard>
    </PressableScale>
  );
}
