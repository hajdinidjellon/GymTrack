import React, { useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatClock, formatRest, formatShortDay } from '@/domain/format';
import { clampRest, REST_STEP } from '@/domain/rest';
import { loadingOf } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import { bestE1rm, repRecords } from '@/domain/strength';
import { warmupsOn } from '@/domain/warmup';
import { defaultIncrementFor, findExerciseDef, ruleFor } from '@/domain/programs';
import { referenceWeight, workingSets } from '@/domain/progression';
import {
  exerciseHistory,
  lastTimeLabel,
  planLift,
  reasonLabel,
  targetLoad,
  weightHistory,
} from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { StickerCard } from '@/components/ui/StickerCard';
import { BackButton } from '@/components/ui/BackButton';
import { LoadedBar } from '@/components/disc/LoadedBar';
import { Sparkline } from '@/components/stats/Sparkline';
import { buzz, PressableScale } from '@/components/ui/PressableScale';
import { SharedRuleEditor } from '@/components/program/SharedRuleEditor';
import { ExerciseNote } from '@/components/session/ExerciseNote';
import { LoadHint } from '@/components/session/LoadHint';
import { CheckRow } from '@/components/ui/CheckRow';
import { CreateExerciseForm } from '@/components/program/CreateExerciseForm';
import { exerciseName, t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';

const STEPS = [1, 1.25, 2, 2.5, 5];

export default function ExerciseScreen() {
  useLocale();
  const { name } = useLocalSearchParams<{ name: string }>();
  const ctx = useBuildContext();
  const def = findExerciseDef(name ?? '', ctx?.settings.customExercises);
  const setIncrement = useSettingsStore((s) => s.setIncrement);
  const setRestOverride = useSettingsStore((s) => s.setRestOverride);
  const setPlateLoaded = useSettingsStore((s) => s.setPlateLoaded);
  const setWarmups = useSettingsStore((s) => s.setWarmups);
  const removeCustomExercise = useSettingsStore((s) => s.removeCustomExercise);
  const [editing, setEditing] = useState(false);
  const warmupChoice = useSettingsStore((s) => s.settings);

  if (!def || !ctx) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          {t('exercise.notFound')}
        </Text>
      </Screen>
    );
  }

  // Created by the user: it can be changed or removed
  const own = def.custom ? ctx.settings.customExercises?.find((e) => e.name === def.name) : undefined;
  const confirmRemove = (name: string) =>
    Alert.alert(t('exercise.own.removeTitle', { name: exerciseName(name) }), t('exercise.own.removeText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('exercise.own.removeConfirm'),
        style: 'destructive',
        onPress: () => {
          removeCustomExercise(name);
          router.back();
        },
      },
    ]);
  const lift = planLift(def, ctx);
  const target = lift.targets[0];
  const fullHistory = exerciseHistory(def, ctx.workouts);
  const history = fullHistory.slice(0, 5);
  const strongest = def.timed ? null : bestE1rm(fullHistory);
  const records = def.timed ? [] : repRecords(fullHistory);
  const bodyweight = def.equipment === 'bodyweight';
  const weights = weightHistory(def, ctx.workouts).map((p) => p.weight);
  const base = ruleFor(ctx.profile.goal, def, defaultIncrementFor(def.equipment, ctx.settings.units));
  const loading = loadingOf({ equipment: def.equipment, plateLoaded: lift.plateLoaded });
  const equipment = t(`program.equipment.${def.equipment}`);
  const warmups = warmupsOn(def.name, warmupChoice);

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader
        eyebrow={def.custom ? t('exercise.ownEyebrow', { equipment }) : equipment}
        title={exerciseName(def.name)}
      />
      {own ? (
        <View style={{ flexDirection: 'row', gap: space.lg, marginTop: -space.sm, marginBottom: space.md }}>
          <Link label={t('exercise.own.edit')} onPress={() => setEditing(true)} />
          <Link label={t('exercise.own.remove')} onPress={() => confirmRemove(own.name)} />
        </View>
      ) : null}
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <Screen scroll>
          {own ? (
            <CreateExerciseForm
              editing={own}
              onCreated={(next) => {
                setEditing(false);
                if (next.name !== own.name) router.setParams({ name: next.name });
              }}
              onCancel={() => setEditing(false)}
            />
          ) : null}
        </Screen>
      </Modal>

      <StickerCard tone="hero">
        <Text size={15} weight="bold">
          {t('exercise.nextTarget')}
        </Text>
        <Text size={34} weight="black" style={{ lineHeight: 42 }}>
          {lift.decision === 'calibrate' ? t('exercise.toCalibrate') : targetLoad(lift.targets, def.timed)}
        </Text>
        <View
          style={{
            marginTop: 8,
            alignSelf: 'flex-start',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: radius.input,
            borderWidth: 2,
            borderColor: colors.frame,
            backgroundColor: colors.sunPanel,
          }}
        >
          <Text size={14} weight="semibold" color={colors.onSunPanel} style={{ lineHeight: 19 }}>
            {reasonLabel(lift)}
          </Text>
        </View>
        {lift.last.length ? (
          <Text size={15} style={{ marginTop: 8 }}>
            {t('exercise.lastTime', { last: lastTimeLabel(lift.last, def.timed) })}
          </Text>
        ) : null}
        {lift.decision !== 'calibrate' && target && target.weight > 0 ? (
          <>
            {loading === 'bar' ? (
              <View style={{ marginTop: 8, height: 80, justifyContent: 'center' }}>
                <LoadedBar weight={target.weight} scale={0.77} barWidth={110} />
              </View>
            ) : null}
            <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <LoadHint loading={loading} weight={target.weight} />
            </View>
          </>
        ) : null}
      </StickerCard>

      <StickerCard style={{ marginTop: 16, gap: space.sm }}>
        <Text size={17} weight="black">
          {t('exercise.note')}
        </Text>
        <ExerciseNote exerciseName={def.name} />
      </StickerCard>

      {weights.length > 1 ? (
        <StickerCard style={{ marginTop: 16, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={17} weight="black">
              {t('exercise.load')}
            </Text>
            <Text size={14} weight="bold" color={colors.inkMuted}>
              {t('exercise.loadRange', { from: formatKg(weights[0]!), to: formatKg(weights[weights.length - 1]!) })}
            </Text>
          </View>
          <Sparkline values={weights} height={72} />
        </StickerCard>
      ) : null}

      {strongest ? (
        <StickerCard style={{ marginTop: 16, gap: space.sm }}>
          <Text size={17} weight="black">
            {t('exercise.strength.title')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={15} weight="bold" color={colors.inkMuted}>
              {t('exercise.strength.e1rm')}
            </Text>
            <Text size={28} weight="black">
              {t('exercise.strength.kg', { kg: formatKg(strongest.value) })}
            </Text>
          </View>
          <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
            {t('exercise.strength.from', {
              kg: formatKg(strongest.weight),
              reps: strongest.reps,
              date: formatShortDay(strongest.date),
            })}
          </Text>
          <Text size={15} weight="black" style={{ marginTop: space.sm }}>
            {t('exercise.strength.perReps')}
          </Text>
          <View>
            {records.map((r, i) => (
              <View
                key={r.reps}
                accessible
                accessibilityLabel={t('exercise.strength.recordA11y', {
                  reps: t('exercise.strength.reps', { count: r.reps }),
                  kg: formatKg(r.weight),
                  date: formatShortDay(r.date),
                })}
                style={{
                  minHeight: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  borderTopWidth: i === 0 ? 0 : 2,
                  borderTopColor: colors.line,
                }}
              >
                <Text size={15} weight="bold" color={colors.inkMuted} style={{ width: 72 }}>
                  {t('exercise.strength.reps', { count: r.reps })}
                </Text>
                <Text size={18} weight="black" style={{ flex: 1 }}>
                  {t('exercise.strength.kg', { kg: formatKg(r.weight) })}
                </Text>
                <Text size={13} color={colors.inkMuted}>
                  {formatShortDay(r.date)}
                </Text>
              </View>
            ))}
          </View>
        </StickerCard>
      ) : null}

      <StickerCard style={{ marginTop: 16 }}>
        <Text size={17} weight="black" style={{ marginBottom: 12 }}>
          {t('exercise.rule')}
        </Text>
        <SharedRuleEditor def={def} goal={ctx.profile.goal} base={base} bodyweight={bodyweight} />
        {def.equipment === 'machine' ? (
          <View style={{ marginTop: 14 }}>
            <CheckRow
              label={t('exercise.plateLoaded.label')}
              checked={lift.plateLoaded}
              onChange={(on) => setPlateLoaded(def, on)}
              detail={t(lift.plateLoaded ? 'exercise.plateLoaded.on' : 'exercise.plateLoaded.off')}
            />
          </View>
        ) : null}
        {!bodyweight ? (
          <>
            <Text size={16} weight="semibold" color={colors.inkMuted} style={{ marginTop: 14 }}>
              {t('exercise.increment.title')}
            </Text>
            <View
              accessibilityRole="radiogroup"
              style={{
                flexDirection: 'row',
                marginTop: 10,
                padding: 4,
                gap: 4,
                borderRadius: radius.pill,
                borderWidth: border.base,
                borderColor: colors.outline,
                backgroundColor: colors.paper,
              }}
            >
              {STEPS.map((v) => {
                const on = lift.rule.increment === v;
                return (
                  <PressableScale
                    key={v}
                    haptic="selection"
                    onPress={() => setIncrement(def.name, v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t('exercise.increment.a11y', { kg: formatKg(v) })}
                    containerStyle={{ flex: 1 }}
                    style={{
                      height: 44,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: on ? border.base : 0,
                      borderColor: colors.outline,
                      backgroundColor: on ? colors.coralSoft : 'transparent',
                    }}
                  >
                    <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                      {t('exercise.increment.option', { kg: formatKg(v) })}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </>
        ) : null}
      </StickerCard>

      <StickerCard style={{ marginTop: 16, gap: 10 }}>
        <Text size={17} weight="black">
          {t('exercise.rest.title')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RoundButton
            label="−"
            a11y={t('exercise.rest.minus', { seconds: REST_STEP })}
            onPress={() => setRestOverride(def.name, clampRest(lift.restTime - REST_STEP))}
          />
          <Text
            size={34}
            weight="black"
            accessibilityLabel={t('exercise.rest.value', { rest: formatRest(lift.restTime) })}
          >
            {formatClock(lift.restTime)}
          </Text>
          <RoundButton
            label="+"
            a11y={t('exercise.rest.plus', { seconds: REST_STEP })}
            onPress={() => setRestOverride(def.name, clampRest(lift.restTime + REST_STEP))}
          />
        </View>
        <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
          {lift.restNote || t('exercise.rest.defaultNote')}
        </Text>
        {lift.restSource === 'own' ? (
          <Pressable
            onPress={() => setRestOverride(def.name, null)}
            accessibilityRole="button"
            hitSlop={8}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
              {t('exercise.rest.auto')}
            </Text>
          </Pressable>
        ) : null}
        {!bodyweight && !def.timed ? (
          <CheckRow
            label={t('exercise.warmups.label')}
            checked={warmups}
            onChange={(on) => setWarmups(def.name, on)}
            detail={t(warmups ? 'exercise.warmups.on' : 'exercise.warmups.off')}
          />
        ) : null}
      </StickerCard>

      {history.length ? (
        <>
          <Text size={19} weight="black" style={{ marginTop: 24 }}>
            {t('exercise.history.title')}
          </Text>
          <View style={{ marginTop: 4 }}>
            {history.map((h, i) => {
              const sets = workingSets(h.sets);
              const w = referenceWeight(sets);
              return (
                <View
                  key={h.date}
                  style={{
                    height: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: i < history.length - 1 ? 2 : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text size={16} color={colors.inkMuted}>
                    {formatShortDay(h.date)}
                  </Text>
                  <Text size={18} weight="black">
                    {w > 0 ? t('exercise.history.weight', { kg: formatKg(w) }) : ''}
                    {sets.map((s) => s.reps).join(' · ')}
                    {def.timed ? ' s' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text size={15} weight="bold" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function RoundButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: radius.pill,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: pressed ? colors.coralSoft : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text size={26} weight="black">
        {label}
      </Text>
    </Pressable>
  );
}
