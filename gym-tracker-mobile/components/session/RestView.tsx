import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius, space } from '@/constants/theme';
import { useRestSecondsLeft } from '@/hooks/useSessionClock';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { MiniPlates } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';

interface Props {
  next: Cursor | null;
  restEndsAt: number;
  total: number;
  /** "Développé couché · série 2 validée", with an undo next to it. */
  doneLabel?: string;
}

/** The rest, at the bottom of the logger: the timer, and what comes next so the bar can be loaded now. */
export function RestView({ next, restEndsAt, total, doneLabel }: Props) {
  const left = useRestSecondsLeft(restEndsAt) ?? 0;
  const addRestTime = useSessionStore((s) => s.addRestTime);
  const stopRestTimer = useSessionStore((s) => s.stopRestTimer);
  const undoLastSet = useSessionStore((s) => s.undoLastSet);
  const perSide = usePerSide(next?.set.weight ?? 0);
  const ratio = Math.max(0, Math.min(1, left / Math.max(total, left, 1)));
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <StickerCard tone="sun" style={{ paddingVertical: 14, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`Repos, ${left} secondes restantes`}
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
        >
          <Text size={56} weight="black" style={{ lineHeight: 62 }}>
            {clock}
          </Text>
          <Text size={16} weight="titleMedium">
            repos
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Nudge label="−15" a11y="Retirer 15 secondes" onPress={() => addRestTime(-15)} />
          <Nudge label="+15" a11y="Ajouter 15 secondes" onPress={() => addRestTime(15)} />
        </View>
      </View>

      {/* La jauge se vide pendant le repos */}
      <View
        style={{
          height: 14,
          borderRadius: 7,
          borderWidth: border.base - 0.5,
          borderColor: colors.ink,
          backgroundColor: colors.sunSoft,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: colors.coral }} />
      </View>

      {next ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={13} weight="semibold" numberOfLines={1}>
              Ensuite · {next.setIndex === 0 ? next.exercise.name : `série ${next.setIndex + 1}`}
            </Text>
            <Text size={22} weight="black" numberOfLines={1}>
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
        </View>
      ) : null}

      <StickerButton label="Passer le repos" variant="secondary" haptic="medium" onPress={stopRestTimer} />
      {doneLabel ? (
        <Pressable
          onPress={undoLastSet}
          accessibilityRole="button"
          accessibilityLabel="Annuler la dernière série"
          hitSlop={8}
          style={{ alignSelf: 'center' }}
        >
          <Text size={13} weight="bold" style={{ textDecorationLine: 'underline' }} numberOfLines={1}>
            {doneLabel} · annuler
          </Text>
        </Pressable>
      ) : null}
    </StickerCard>
  );
}

function Nudge({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        height: 44,
        minWidth: 52,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: border.base,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.sunSoft : colors.card,
      })}
    >
      <Text size={15} weight="titleMedium">
        {label}
      </Text>
    </Pressable>
  );
}
