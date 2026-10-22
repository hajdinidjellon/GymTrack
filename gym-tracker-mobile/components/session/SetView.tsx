import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/constants/theme';
import { describeSide, formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Stepper } from '@/components/ui/Stepper';
import { Check } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { MissedRepsSheet } from './MissedRepsSheet';

/** One set on screen: everything is pre-filled, the user only validates. */
export function SetView({ cursor }: { cursor: Cursor }) {
  const { exercise, setIndex, set } = cursor;
  const nudgeSet = useSessionStore((s) => s.nudgeSet);
  const completeSet = useSessionStore((s) => s.completeSet);
  const completeRemaining = useSessionStore((s) => s.completeRemaining);
  const updateSet = useSessionStore((s) => s.updateSet);
  const [missed, setMissed] = useState(false);

  const step = exercise.rule?.increment ?? 2.5;
  const perSide = usePerSide(set.weight);
  const remaining = exercise.sets.filter((s) => !s.completed).length;
  const bodyweight = exercise.equipment === 'bodyweight';
  const targetReps = set.target?.reps ?? set.reps;

  return (
    <View style={{ flex: 1 }}>
      {exercise.lastTime || (setIndex === 0 && exercise.reason) ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {exercise.lastTime ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text size={13} weight="bold" color={colors.faint}>
                DERNIÈRE FOIS
              </Text>
              <Text size={14} weight="bold" color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
                {exercise.lastTime}
              </Text>
            </View>
          ) : null}
          {setIndex === 0 && exercise.reason ? (
            <Text size={14} color={colors.brass} numberOfLines={2} style={{ lineHeight: 19 }}>
              {exercise.reason}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Card style={{ marginTop: 12, paddingHorizontal: 6, paddingVertical: 8 }}>
        {!bodyweight ? (
          <>
            <Stepper
              value={formatKg(set.weight)}
              unit="kg"
              onMinus={() => nudgeSet(exercise.id, setIndex, 'weight', -step)}
              onPlus={() => nudgeSet(exercise.id, setIndex, 'weight', step)}
              minusLabel={`Moins ${formatKg(step)} kg`}
              plusLabel={`Plus ${formatKg(step)} kg`}
            />
            {exercise.equipment === 'barbell' ? (
              <>
                <View style={{ height: 92, justifyContent: 'center' }}>
                  <Barbell perSide={perSide} scale={0.85} />
                </View>
                <Text size={14} weight="bold" color={colors.muted} align="center" style={{ marginTop: 2 }}>
                  {perSide.length ? `Par côté : ${describeSide(perSide)}` : 'Barre à vide'}
                </Text>
              </>
            ) : null}
            <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: 10, marginHorizontal: 12 }} />
          </>
        ) : null}
        <Stepper
          value={String(set.reps)}
          unit="reps"
          onMinus={() => nudgeSet(exercise.id, setIndex, 'reps', -1)}
          onPlus={() => nudgeSet(exercise.id, setIndex, 'reps', 1)}
          minusLabel="Moins une rep"
          plusLabel="Plus une rep"
          onLongPress={() => setMissed(true)}
        />
      </Card>
      <Pressable
        onPress={() => setMissed(true)}
        accessibilityRole="button"
        hitSlop={8}
        style={{ marginTop: 10, alignSelf: 'center' }}
      >
        <Text size={14} weight="bold" color={colors.muted} style={{ textDecorationLine: 'underline' }}>
          Série ratée ? Note les reps faites
        </Text>
      </Pressable>

      <View style={{ flex: 1, minHeight: 12 }} />

      {remaining > 1 ? (
        <Button
          label={`Tout comme prévu · ${remaining} séries`}
          variant="secondary"
          height={48}
          haptic="light"
          onPress={() => completeRemaining(exercise.id)}
        />
      ) : null}
      <Button
        label="Valider"
        height={76}
        icon={<Check size={30} />}
        accessibilityLabel="Valider la série"
        testID="validate-set"
        onPress={() => completeSet(exercise.id, setIndex)}
        style={{ marginTop: 10 }}
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
