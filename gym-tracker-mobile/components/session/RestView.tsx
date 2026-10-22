import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { useRestSecondsLeft } from '@/hooks/useSessionClock';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RestDisc } from '@/components/disc/RestDisc';
import { MiniPlates } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';

/** Between two sets: the timer, and what comes next so the bar can be loaded now. */
export function RestView({ next, restEndsAt, total }: { next: Cursor | null; restEndsAt: number; total: number }) {
  const left = useRestSecondsLeft(restEndsAt) ?? 0;
  const addRestTime = useSessionStore((s) => s.addRestTime);
  const stopRestTimer = useSessionStore((s) => s.stopRestTimer);
  const perSide = usePerSide(next?.set.weight ?? 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <RestDisc secondsLeft={left} total={Math.max(total, left)} />
      </View>

      {next ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text size={13} weight="bold" color={colors.faint} numberOfLines={1}>
              ENSUITE · {next.setIndex === 0 ? next.exercise.name.toUpperCase() : `SÉRIE ${next.setIndex + 1}`}
            </Text>
            <Text size={24} weight="black" style={{ marginTop: 2 }}>
              {next.exercise.needsWeight
                ? 'Charge à régler'
                : next.set.weight > 0
                  ? `${formatKg(next.set.weight)} kg × ${next.set.reps}`
                  : `${next.set.reps} reps`}
            </Text>
          </View>
          {next.exercise.equipment === 'barbell' && !next.exercise.needsWeight ? (
            <MiniPlates perSide={perSide} />
          ) : null}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button
          label="−15 s"
          variant="secondary"
          height={52}
          haptic="selection"
          accessibilityLabel="Retirer 15 secondes"
          onPress={() => addRestTime(-15)}
          style={{ flex: 1 }}
        />
        <Button
          label="+15 s"
          variant="secondary"
          height={52}
          haptic="selection"
          accessibilityLabel="Ajouter 15 secondes"
          onPress={() => addRestTime(15)}
          style={{ flex: 1 }}
        />
      </View>
      <Button label="Passer le repos" height={64} haptic="medium" onPress={stopRestTimer} style={{ marginTop: 10 }} />
    </View>
  );
}
