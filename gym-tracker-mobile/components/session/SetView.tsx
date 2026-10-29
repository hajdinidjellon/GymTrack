import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { border, colors, radius, space } from '@/constants/theme';
import { loadingOf } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Stepper } from '@/components/ui/Stepper';
import { Check } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { ExerciseNote } from './ExerciseNote';
import { LoadHint } from './LoadHint';
import { MissedRepsSheet } from './MissedRepsSheet';
import { SetsTable } from './SetRow';

interface Props {
  cursor: Cursor;
  /** Replaces the validate buttons at the bottom: the rest panel, during a rest. */
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
  const [missed, setMissed] = useState(false);

  const step = exercise.rule?.increment ?? 2.5;
  const perSide = usePerSide(set.weight);
  const remaining = exercise.sets.filter((s) => !s.completed).length;
  const bodyweight = exercise.equipment === 'bodyweight';
  const loading = loadingOf(exercise);
  const targetReps = set.target?.reps ?? set.reps;
  const why = setIndex === 0 && exercise.reason;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, marginHorizontal: -space.gutter }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.lg }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {exercise.lastTime ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              Dernière fois
            </Text>
            <Text size={14} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {exercise.lastTime}
            </Text>
          </View>
        ) : null}
        <View style={{ marginTop: space.sm }}>
          <ExerciseNote exerciseName={exercise.name} />
        </View>
        {why ? (
          <View
            style={{
              marginTop: space.sm,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderColor: colors.ink,
              backgroundColor: colors.sun,
            }}
          >
            {set.weight > 0 ? (
              <Text size={14} weight="black">
                Pourquoi {formatKg(set.weight)} kg ?
              </Text>
            ) : null}
            <Text size={14} weight="semibold" style={{ lineHeight: 19 }}>
              {exercise.reason}
            </Text>
          </View>
        ) : null}

        <StickerCard style={{ marginTop: space.md, paddingHorizontal: 10, paddingVertical: 10 }}>
          {!bodyweight ? (
            <>
              <Stepper
                value={formatKg(set.weight)}
                unit="kg"
                onMinus={() => nudgeSet(exercise.id, setIndex, 'weight', -step)}
                onPlus={() => nudgeSet(exercise.id, setIndex, 'weight', step)}
                minusLabel={`Moins ${formatKg(step)} kg`}
                plusLabel={`Plus ${formatKg(step)} kg`}
                onChange={(weight) => updateSet(exercise.id, setIndex, { weight })}
                inputLabel="Charge en kilos"
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
            unit="reps"
            onMinus={() => nudgeSet(exercise.id, setIndex, 'reps', -1)}
            onPlus={() => nudgeSet(exercise.id, setIndex, 'reps', 1)}
            minusLabel="Moins une rep"
            plusLabel="Plus une rep"
            onChange={(reps) => updateSet(exercise.id, setIndex, { reps })}
            integer
            inputLabel="Nombre de reps"
          />
        </StickerCard>
        <Pressable
          onPress={() => setMissed(true)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ marginTop: space.md, alignSelf: 'center' }}
        >
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            Série ratée ? Note les reps faites
          </Text>
        </Pressable>

        <View style={{ marginTop: space.lg }}>
          <SetsTable exercise={exercise} current={setIndex} onRemove={(i) => removeSet(exercise.id, i)} />
          <Pressable
            onPress={() => addSet(exercise.id)}
            accessibilityRole="button"
            accessibilityLabel="Ajouter une série"
            style={({ pressed }) => ({
              marginTop: 8,
              height: 48,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderStyle: 'dashed',
              borderColor: pressed ? colors.ink : colors.line,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text size={15} weight="bold" color={colors.inkMuted}>
              + Ajouter une série
            </Text>
          </Pressable>
          {exercise.sets.length > 1 ? (
            <Text size={13} color={colors.inkFaint} align="center" style={{ marginTop: 6 }}>
              Glisse une série vers la gauche pour la supprimer
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ gap: space.sm + 2, paddingTop: space.sm }}>
        {footer ?? (
          <>
            {remaining > 1 ? (
              <StickerButton
                label={`Tout comme prévu · ${remaining} séries`}
                variant="secondary"
                size="small"
                onPress={() => {
                  Keyboard.dismiss();
                  completeRemaining(exercise.id);
                }}
              />
            ) : null}
            <StickerButton
              label="Valider"
              size="xl"
              icon={<Check size={28} />}
              accessibilityLabel="Valider la série"
              testID="validate-set"
              onPress={() => {
                Keyboard.dismiss();
                completeSet(exercise.id, setIndex);
              }}
            />
          </>
        )}
      </View>

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
