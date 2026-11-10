import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { border, colors, radius, space } from '@/constants/theme';
import { loadingOf } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { isWarmup, setNumber, workingCount } from '@/domain/warmup';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Stepper } from '@/components/ui/Stepper';
import { Check } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { HoldTimer } from './HoldTimer';
import { LoadHint } from './LoadHint';
import { MissedRepsSheet } from './MissedRepsSheet';
import { EditSetSheet } from './EditSetSheet';
import { ActionSheet, type SheetAction } from '@/components/ui/ActionSheet';
import { SetsTable } from './SetRow';
import { t } from '@/i18n';

interface Props {
  cursor: Cursor;
  /** Above the validate buttons: the minimized rest bar. Validating ends the rest. */
  footer?: React.ReactNode;
}

/** One set on screen: everything is pre-filled, the user only validates. */
export function SetView({ cursor, footer }: Props) {
  const { exercise, setIndex, set } = cursor;
  const nudgeSet = useSessionStore((s) => s.nudgeSet);
  const completeSet = useSessionStore((s) => s.completeSet);
  const completeRemaining = useSessionStore((s) => s.completeRemaining);
  const updateSet = useSessionStore((s) => s.updateSet);
  const addSet = useSessionStore((s) => s.addSet);
  const removeSet = useSessionStore((s) => s.removeSet);
  const skipWarmups = useSessionStore((s) => s.skipWarmups);
  const addDropSet = useSessionStore((s) => s.addDropSet);
  const toggleFailure = useSessionStore((s) => s.toggleFailure);

  // "⋯" or a long press on a set: its menu. A validated set: correct it (`editing`)
  const [menu, setMenu] = useState<{ index: number; deletable: boolean } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const titleOf = (i: number) => {
    const { warmup, drop, n } = setNumber(exercise.sets, i);
    return warmup
      ? t('session.setMenu.titleWarmup')
      : drop
        ? t('session.setMenu.titleDrop')
        : t('session.setMenu.title', { n });
  };
  const menuActions = (): SheetAction[] => {
    const target = menu ? exercise.sets[menu.index] : undefined;
    if (!menu || !target) return [];
    const i = menu.index;
    const { warmup, drop } = setNumber(exercise.sets, i);
    const actions: SheetAction[] = [];
    if (target.completed)
      actions.push({
        label: t('session.setMenu.edit'),
        hint: t('session.setMenu.editHint'),
        opensSheet: true,
        onPress: () => setEditing(i),
      });
    if (target.weight > 0 && !warmup)
      actions.push({ label: t('session.setMenu.addDrop'), onPress: () => addDropSet(exercise.id, i) });
    if (!drop && !warmup) {
      const failure = target.setType === 'failure';
      actions.push({
        label: t(failure ? 'session.setMenu.normal' : 'session.setMenu.failure'),
        onPress: () => toggleFailure(exercise.id, i),
      });
    }
    if (menu.deletable)
      actions.push({
        label: t(warmup ? 'session.setMenu.deleteWarmup' : 'session.setMenu.delete'),
        danger: true,
        onPress: () => removeSet(exercise.id, i),
      });
    return actions;
  };
  const editedSet = editing !== null ? exercise.sets[editing] : undefined;
  const [missed, setMissed] = useState(false);

  const step = exercise.rule?.increment ?? 2.5;
  const perSide = usePerSide(set.weight);
  const warmup = isWarmup(set);
  const timed = !!exercise.timed && !warmup;
  const repStep = timed ? (exercise.rule?.repStep ?? 5) : 1;
  const remaining = workingCount(exercise.sets, 'left');
  // "Tout comme prévu" once the first set is done: never a mis-tap away from set 1
  const started = workingCount(exercise.sets, 'done') > 0;
  const firstSessions = useWorkoutStore((s) => s.workouts.length < 3);
  const bodyweight = exercise.equipment === 'bodyweight';
  const loading = loadingOf(exercise);
  const targetReps = set.target?.reps ?? set.reps;
  // On the first set of the exercise, warm-up or not; the weight it explains is the working one
  const why = setIndex === 0 && exercise.reason;
  // The weight the reason explains is the working one: a kept top set is not it
  const firstWorking = exercise.sets.find((s) => !isWarmup(s) && s.setType !== 'top');
  const whyKg = firstWorking?.target?.weight ?? firstWorking?.weight ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, marginHorizontal: -space.gutter }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.lg }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {exercise.lastTime ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              {t('session.setView.lastTime')}
            </Text>
            <Text size={14} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {exercise.lastTime}
            </Text>
          </View>
        ) : null}
        {why ? (
          <View
            style={{
              marginTop: space.sm,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderColor: colors.frame,
              backgroundColor: colors.sunPanel,
            }}
          >
            {whyKg > 0 ? (
              <Text size={14} weight="black" color={colors.onSunPanel}>
                {t(exercise.assisted ? 'session.setView.whyAssist' : 'session.setView.why', { kg: formatKg(whyKg) })}
              </Text>
            ) : null}
            <Text size={14} weight="semibold" style={{ lineHeight: 19 }}>
              {exercise.reason}
            </Text>
          </View>
        ) : null}

        {warmup ? (
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ marginTop: space.md }}>
            {t('session.setView.warmupHint')}
          </Text>
        ) : null}
        <StickerCard style={{ marginTop: warmup ? space.sm : space.md, paddingHorizontal: 10, paddingVertical: 10 }}>
          {!bodyweight ? (
            <>
              <Stepper
                value={formatKg(set.weight)}
                unit="kg"
                onMinus={() => nudgeSet(exercise.id, setIndex, 'weight', -step)}
                onPlus={() => nudgeSet(exercise.id, setIndex, 'weight', step)}
                minusLabel={t('session.weightMinus', { kg: formatKg(step) })}
                plusLabel={t('session.weightPlus', { kg: formatKg(step) })}
                onChange={(weight) => updateSet(exercise.id, setIndex, { weight })}
                inputLabel={t('session.setView.weightInput')}
              />
              {loading === 'bar' ? (
                <View style={{ height: 96, justifyContent: 'center' }}>
                  <Barbell perSide={perSide} scale={0.85} />
                </View>
              ) : null}
              <LoadHint loading={loading} weight={set.weight} />
              <View
                style={{
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.line,
                  marginVertical: 10,
                  marginHorizontal: 8,
                }}
              />
            </>
          ) : null}
          <Stepper
            value={String(set.reps)}
            unit={timed ? t('session.setView.secondsUnit') : t('common.reps')}
            onMinus={() => nudgeSet(exercise.id, setIndex, 'reps', -repStep)}
            onPlus={() => nudgeSet(exercise.id, setIndex, 'reps', repStep)}
            minusLabel={timed ? t('session.setView.secondsMinus') : t('session.setView.repMinus')}
            plusLabel={timed ? t('session.setView.secondsPlus') : t('session.setView.repPlus')}
            onChange={(reps) => updateSet(exercise.id, setIndex, { reps })}
            integer
            inputLabel={timed ? t('session.setView.secondsInput') : t('session.setView.repsInput')}
          />
        </StickerCard>
        {warmup || timed ? null : (
          <Pressable
            onPress={() => setMissed(true)}
            accessibilityRole="button"
            hitSlop={8}
            style={{ marginTop: space.md, alignSelf: 'center' }}
          >
            <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
              {t('session.setView.missed')}
            </Text>
          </Pressable>
        )}

        <View style={{ marginTop: space.lg }}>
          <SetsTable
            exercise={exercise}
            current={setIndex}
            onRemove={(i) => removeSet(exercise.id, i)}
            onMenu={(index, deletable) => setMenu({ index, deletable })}
            onEdit={setEditing}
          />
          <Pressable
            onPress={() => addSet(exercise.id)}
            accessibilityRole="button"
            accessibilityLabel={t('session.setView.addSetA11y')}
            style={({ pressed }) => ({
              marginTop: 8,
              minHeight: 48,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderStyle: 'dashed',
              borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text size={15} weight="bold" color={colors.inkMuted}>
              {t('session.setView.addSet')}
            </Text>
          </Pressable>
          {exercise.sets.length > 1 && firstSessions ? (
            <Text size={13} color={colors.inkFaint} align="center" style={{ marginTop: 6 }}>
              {t('session.setView.swipeHint')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ gap: space.sm + 2, paddingTop: space.sm }}>
        {footer}
        {timed ? (
          <HoldTimer key={`${exercise.id}-${setIndex}`} cursor={cursor} />
        ) : (
          <>
            {warmup ? (
              <StickerButton
                label={t('session.setView.skipWarmup')}
                variant="secondary"
                size="small"
                style={{ marginBottom: space.sm }}
                onPress={() => {
                  Keyboard.dismiss();
                  skipWarmups(exercise.id);
                }}
              />
            ) : remaining > 1 && started ? (
              <StickerButton
                // Set apart from Valider: a tap a little too high must not validate every set
                label={t('session.setView.allAsPlanned', { count: remaining })}
                variant="secondary"
                size="small"
                style={{ marginBottom: space.sm }}
                onPress={() => {
                  Keyboard.dismiss();
                  completeRemaining(exercise.id);
                }}
              />
            ) : null}
            <StickerButton
              label={t('common.validate')}
              size="xl"
              icon={<Check size={28} />}
              accessibilityLabel={t('session.setView.validateA11y')}
              testID="validate-set"
              onPress={() => {
                Keyboard.dismiss();
                completeSet(exercise.id, setIndex);
              }}
            />
          </>
        )}
      </View>

      <ActionSheet
        visible={!!menu}
        title={menu ? titleOf(menu.index) : ''}
        actions={menuActions()}
        onClose={() => setMenu(null)}
      />
      <EditSetSheet
        key={editing ?? 'closed'}
        set={editedSet ? { weight: editedSet.weight, reps: editedSet.reps } : null}
        title={editing !== null ? t('session.editSet.title', { set: titleOf(editing) }) : ''}
        noWeight={exercise.equipment === 'bodyweight'}
        timed={!!exercise.timed && !!editedSet && !isWarmup(editedSet)}
        step={step}
        repStep={exercise.timed ? (exercise.rule?.repStep ?? 5) : 1}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          if (editing !== null) updateSet(exercise.id, editing, values);
          setEditing(null);
        }}
      />
      <MissedRepsSheet
        visible={missed}
        target={targetReps}
        weight={set.weight}
        onClose={() => setMissed(false)}
        onSave={(reps) => {
          setMissed(false);
          updateSet(exercise.id, setIndex, { reps });
          completeSet(exercise.id, setIndex);
        }}
      />
    </View>
  );
}
