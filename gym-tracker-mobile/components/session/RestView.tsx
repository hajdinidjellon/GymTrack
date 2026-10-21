import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { useRestSecondsLeft } from '@/hooks/useSessionClock';
import { formatKg } from '@/lib/plates';
import type { Cursor } from '@/lib/sessionCursor';
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
            <Text size={15} weight="semibold" color={colors.muted} numberOfLines={1}>
              Ensuite · {next.setIndex === 0 ? next.exercise.name : `série ${next.setIndex + 1}`}
            </Text>
            <Text size={28} weight="black" style={{ marginTop: 2 }}>
              {next.exercise.needsWeight
                ? 'Charge à régler'
                : next.set.weight > 0
                  ? `${formatKg(next.set.weight)} kg × ${next.set.reps}`
                  : `${next.set.reps} reps`}
            </Text>
          </View>
          {next.exercise.equipment === 'barbell' && !next.exercise.needsWeight ? <MiniPlates perSide={perSide} /> : null}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Button label="+30 s" variant="outline" height={80} onPress={() => addRestTime(30)} style={{ flex: 1, borderWidth: 2.5 }} />
        <Button label="Passer" height={80} onPress={stopRestTimer} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
