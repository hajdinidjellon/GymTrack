import React from 'react';
import { View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';

type State = 'done' | 'current' | 'upcoming';

interface Props {
  index: number;
  kg: number;
  reps: number;
  state: State;
  /** Bodyweight: no kg column. */
  noWeight?: boolean;
}

/** One line of the sets table: Série | kg | reps | mark. The current one is circled. */
export function SetRow({ index, kg, reps, state, noWeight }: Props) {
  const current = state === 'current';
  const done = state === 'done';
  const color = done ? colors.successText : state === 'upcoming' ? colors.inkMuted : colors.ink;
  const label = `Série ${index}, ${noWeight ? '' : `${formatKg(kg)} kilos, `}${reps} reps, ${
    done ? 'faite' : current ? 'en cours' : 'à venir'
  }`;

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
        backgroundColor: done ? colors.successSoft : current ? colors.coralSoft : 'transparent',
        borderWidth: current ? border.strong : 0,
        borderColor: colors.ink,
      }}
    >
      <Text size={16} weight="bold" color={color} style={{ width: 52 }}>
        {index}
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

/** Every set of the exercise. Column headers are the only capitals of the app. */
export function SetsTable({ exercise, current }: { exercise: ActiveExercise; current: number }) {
  const noWeight = exercise.equipment === 'bodyweight';
  return (
    <View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 4 }}>
        <Header label="SÉRIE" style={{ width: 52 }} />
        {noWeight ? null : <Header label="KG" center />}
        <Header label="REPS" center />
        <View style={{ width: 44 }} />
      </View>
      <View style={{ gap: 4 }}>
        {exercise.sets.map((s, i) => (
          <SetRow
            key={i}
            index={i + 1}
            kg={s.weight}
            reps={s.reps}
            noWeight={noWeight}
            state={s.completed ? 'done' : i === current ? 'current' : 'upcoming'}
          />
        ))}
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
