import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { useLocale } from '@/hooks/useLocale';
import { dayName, exerciseName, t } from '@/i18n';
import { describeSide, loadBar } from '@/domain/plates';
import { choosableDays, type ChoosableDay, hasExercises, equipmentShown } from '@/domain/programs';
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

export default function Preview() {
  useLocale();
  const ctx = useBuildContext();
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const ownDays = useSettingsStore((s) => s.settings.ownDays);
  const [picked, setPicked] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const splitId = ctx?.profile.program.split;
  // Le programme, puis les séances des autres programmes, pour une fois
  const days = splitId ? choosableDays(splitId, customDays, own, ownDays).filter(hasExercises) : [];
  const today = ctx ? nextDay(ctx) : null;
  const day: ChoosableDay | undefined =
    days.find((d) => d.name === (picked ?? today?.name)) ??
    (today && splitId ? { ...today, split: splitId, extra: false } : undefined);
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
        <StickerButton
          label={t('session.preview.start')}
          haptic="medium"
          disabled={plan.lifts.length === 0}
          onPress={start}
        />
      }
    >
      <BackButton label={t('session.backHome')} />
      <ScreenHeader
        eyebrow={t(
          day.extra
            ? 'session.preview.extraEyebrow'
            : plan.name === today.name
              ? 'session.preview.todayEyebrow'
              : 'session.preview.chosenEyebrow',
          { minutes: plan.minutes },
        )}
        title={dayName(plan.name)}
        subtitle={t(day.extra ? 'session.preview.extraSubtitle' : 'session.preview.subtitle')}
      />

      <Text size={14} weight="bold" color={colors.inkMuted}>
        {t('session.preview.otherDay')}
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
              onPress={() => setPicked(d.name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(
                d.extra
                  ? 'session.preview.dayExtraA11y'
                  : d.name === today.name
                    ? 'session.preview.dayTodayA11y'
                    : 'session.preview.dayA11y',
                { name: dayName(d.name) },
              )}
              style={{
                height: 44,
                paddingHorizontal: 18,
                borderRadius: radius.pill,
                borderWidth: on ? border.strong : border.base,
                // Hors programme : en pointillés tant qu'on ne l'a pas choisie
                borderStyle: d.extra && !on ? 'dashed' : 'solid',
                borderColor: d.extra && !on ? colors.inkFaint : colors.outlineStrong,
                backgroundColor: on ? colors.coralSoft : colors.card,
                justifyContent: 'center',
              }}
            >
              <Text size={16} weight={on ? 'black' : 'titleMedium'}>
                {dayName(d.name)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <DayExercisesEditor
        split={day.split}
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
      accessibilityLabel={t('session.preview.liftA11y', {
        name: exerciseName(lift.def.name),
        target: calibrate ? t('session.preview.firstTime') : targetLabel(lift.targets, lift.def.timed),
        delta: deltaLabel(lift),
      })}
    >
      <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IndexBadge value={index + 1} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text size={16} weight="black" numberOfLines={1}>
            {exerciseName(lift.def.name)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text size={14} weight="semibold" color={colors.inkMuted} numberOfLines={1} style={{ flexShrink: 1 }}>
              {calibrate ? t('session.preview.weightToPick') : targetLabel(lift.targets, lift.def.timed)}
            </Text>
            {progress ? <Chip tone="success" label={deltaLabel(lift)} /> : null}
          </View>
        </View>
        {showPlates ? (
          <View accessible accessibilityLabel={t('session.preview.perSideA11y', { plates: describeSide(perSide) })}>
            <MiniPlates perSide={perSide} />
          </View>
        ) : (
          // Chip sticks to the top of a row on its own: the wrapper centres it
          <View>
            <Chip
              label={
                calibrate ? t('session.preview.calibrate') : t(`session.preview.equipment.${equipmentShown(lift.def)}`)
              }
            />
          </View>
        )}
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t('session.preview.remove', { name: exerciseName(lift.def.name) })}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.outline,
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
