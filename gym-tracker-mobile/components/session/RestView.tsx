import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius, space } from '@/constants/theme';
import { useRestSecondsLeft } from '@/hooks/useSessionClock';
import { formatClock } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { MiniPlates } from '@/components/disc/Barbell';
import { usePerSide } from '@/components/disc/LoadedBar';
import { EffortPicker } from './EffortPicker';

interface Props {
  next: Cursor | null;
  restEndsAt: number;
  total: number;
  /** "Développé couché · série 2 validée", with an undo next to it. */
  doneLabel?: string;
  /** Shrinks the popup to a small bar at the bottom. */
  onMinimize?: () => void;
  /** Why this rest lasts what it lasts: "Gros mouvement à la barre…". */
  note?: string;
}

/** The rest, in a popup in the middle of the screen: the timer, and what comes next so the bar can be loaded now. */
export function RestView({ next, restEndsAt, total, doneLabel, onMinimize, note }: Props) {
  const left = useRestSecondsLeft(restEndsAt) ?? 0;
  const addRestTime = useSessionStore((s) => s.addRestTime);
  const stopRestTimer = useSessionStore((s) => s.stopRestTimer);
  const undoLastSet = useSessionStore((s) => s.undoLastSet);
  const perSide = usePerSide(next?.set.weight ?? 0);
  const ratio = Math.max(0, Math.min(1, left / Math.max(total, left, 1)));
  const clock = formatClock(left);

  return (
    <StickerCard tone="sun" style={{ paddingVertical: 14, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text size={18} weight="black">
          Repos
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onMinimize ? <Nudge label="Réduire" a11y="Réduire le minuteur" onPress={onMinimize} /> : null}
          <Nudge label="✕" a11y="Fermer le repos" onPress={stopRestTimer} />
        </View>
      </View>

      {note ? (
        <Text size={13} weight="semibold" style={{ marginTop: -6, lineHeight: 18 }}>
          {note}
        </Text>
      ) : null}

      {doneLabel ? <EffortPicker /> : null}

      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Repos, ${left} secondes restantes`}
        style={{ alignItems: 'center' }}
      >
        <Text size={88} weight="black" style={{ lineHeight: 96 }}>
          {clock}
        </Text>
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

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        <Nudge label="−15 s" a11y="Retirer 15 secondes" onPress={() => addRestTime(-15)} />
        <Nudge label="+15 s" a11y="Ajouter 15 secondes" onPress={() => addRestTime(15)} />
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

/** The rest once minimized: a small bar at the bottom. A tap brings the popup back. */
export function RestMini({ restEndsAt, onExpand }: { restEndsAt: number; onExpand: () => void }) {
  const left = useRestSecondsLeft(restEndsAt) ?? 0;
  const clock = formatClock(left);
  return (
    <Pressable
      onPress={onExpand}
      accessibilityRole="button"
      accessibilityLabel={`Repos, ${left} secondes restantes. Agrandir le minuteur`}
      style={({ pressed }) => ({
        height: 60,
        paddingHorizontal: 18,
        borderRadius: radius.pill,
        borderWidth: border.strong,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.sunSoft : colors.sun,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      })}
    >
      <Text size={16} weight="titleMedium">
        Repos
      </Text>
      <Text size={28} weight="black">
        {clock}
      </Text>
      <Text size={14} weight="bold" style={{ textDecorationLine: 'underline' }}>
        Agrandir
      </Text>
    </Pressable>
  );
}
