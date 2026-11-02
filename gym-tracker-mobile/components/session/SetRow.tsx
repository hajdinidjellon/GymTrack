import React from 'react';
import { View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import { isWarmup, setNumber, workingCount } from '@/domain/warmup';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { Check } from '@/components/ui/icons';
import { t } from '@/i18n';

type State = 'done' | 'current' | 'upcoming';

interface Props {
  index: number;
  kg: number;
  reps: number;
  state: State;
  /** Bodyweight: no kg column. */
  noWeight?: boolean;
  /** A warm-up: "Éch." instead of its number. */
  warmup?: boolean;
}

/** One line of the sets table: Série | kg | reps | mark. The current one is circled. */
export function SetRow({ index, kg, reps, state, noWeight, warmup }: Props) {
  const current = state === 'current';
  const done = state === 'done';
  const color = done ? colors.successText : state === 'upcoming' ? colors.inkMuted : colors.ink;
  const stateLabel = t(done ? 'session.setRow.done' : current ? 'session.setRow.current' : 'session.setRow.upcoming');
  const label = warmup
    ? t('session.setRow.a11yWarmup', { kg: formatKg(kg), reps, state: stateLabel })
    : noWeight
      ? t('session.setRow.a11yNoWeight', { index, reps, state: stateLabel })
      : t('session.setRow.a11y', { index, kg: formatKg(kg), reps, state: stateLabel });

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: current ? 58 : 48,
        paddingHorizontal: 10,
        borderRadius: radius.row,
        borderWidth: current ? border.strong : 0,
        borderColor: colors.ink,
        backgroundColor: done ? colors.successSoft : current ? colors.coralSoft : colors.paper,
      }}
    >
      <Text size={warmup ? 14 : 16} weight="bold" color={warmup ? colors.inkMuted : color} style={{ width: 52 }}>
        {warmup ? t('session.setRow.warmupShort') : index}
      </Text>
      {noWeight ? null : <Cell value={formatKg(kg)} color={color} big={current} />}
      <Cell value={String(reps)} color={color} big={current} />
      <View style={{ width: 44, alignItems: 'flex-end' }}>
        {done ? <DoneMark /> : null}
        {current ? (
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: colors.coral,
              borderWidth: 2,
              borderColor: colors.ink,
            }}
          />
        ) : null}
        {state === 'upcoming' ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: colors.line,
              borderStyle: 'dashed',
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function Cell({ value, color, big }: { value: string; color: string; big: boolean }) {
  return (
    <Text size={big ? 24 : 20} weight={big ? 'black' : 'titleMedium'} color={color} align="center" style={{ flex: 1 }}>
      {value}
    </Text>
  );
}

function DoneMark() {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={18} />
    </View>
  );
}

interface TableProps {
  exercise: ActiveExercise;
  current: number;
  /** Sets still to do can be swiped away. */
  onRemove?: (setIndex: number) => void;
}

/** Every set of the exercise. Column headers are the only capitals of the app. */
export function SetsTable({ exercise, current, onRemove }: TableProps) {
  const noWeight = exercise.equipment === 'bodyweight';
  // A warm-up can always go; the last working set stays
  const canRemove = (i: number) => !!onRemove && (isWarmup(exercise.sets[i]!) || workingCount(exercise.sets) > 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 4 }}>
        <Header label={t('session.setRow.headerSet')} style={{ width: 52 }} />
        {noWeight ? null : <Header label={t('session.setRow.headerKg')} center />}
        <Header label={t('session.setRow.headerReps')} center />
        <View style={{ width: 44 }} />
      </View>
      <View style={{ gap: 4 }}>
        {exercise.sets.map((s, i) => {
          const { warmup, n } = setNumber(exercise.sets, i);
          return (
            <SwipeToDelete
              key={`${i}-${exercise.sets.length}`}
              deleteLabel={warmup ? t('session.setRow.deleteWarmupA11y') : t('session.setRow.deleteA11y', { n })}
              onDelete={canRemove(i) && !s.completed ? () => onRemove!(i) : undefined}
            >
              <SetRow
                index={n}
                kg={s.weight}
                reps={s.reps}
                noWeight={noWeight}
                warmup={warmup}
                state={s.completed ? 'done' : i === current ? 'current' : 'upcoming'}
              />
            </SwipeToDelete>
          );
        })}
      </View>
    </View>
  );
}

function Header({ label, center, style }: { label: string; center?: boolean; style?: { width: number } }) {
  return (
    <Text
      size={12}
      weight="bold"
      color={colors.inkFaint}
      align={center ? 'center' : undefined}
      style={[{ letterSpacing: 1.2 }, center ? { flex: 1 } : null, style]}
    >
      {label}
    </Text>
  );
}
