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
      {!bodyweight ? (
        <Card style={{ marginTop: 16, paddingHorizontal: 8, paddingTop: 14 }}>
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
              <View style={{ marginTop: 6, height: 108, justifyContent: 'center' }}>
                <Barbell perSide={perSide} />
              </View>
              <Text size={16} weight="bold" align="center" style={{ marginTop: 4 }}>
                {perSide.length ? `Par côté : ${describeSide(perSide)}` : 'Barre à vide'}
              </Text>
            </>
          ) : null}
        </Card>
      ) : null}

      <Card style={{ marginTop: 12, paddingHorizontal: 8, paddingVertical: 12 }}>
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
        style={{ marginTop: 10, alignItems: 'center' }}
      >
        <Text size={15} weight="bold" color={colors.muted}>
          Série ratée ? Appui long sur les reps
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      {remaining > 1 ? (
        <Button
          label={`Tout comme prévu · ${remaining} séries`}
          variant="outline"
          height={54}
          onPress={() => completeRemaining(exercise.id)}
        />
      ) : null}
      <Button
        label="Valider"
        height={96}
        icon={<Check />}
        accessibilityLabel="Valider la série"
        testID="validate-set"
        onPress={() => completeSet(exercise.id, setIndex)}
        style={{ marginTop: 12 }}
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
