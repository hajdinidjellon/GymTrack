import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { NumericInput } from '@/components/ui/Input';
import { SetTypeBadge } from '@/components/ui/Badge';
import { colors } from '@/constants/theme';
import type { WorkoutSet, SetType } from '@/types';
import { calculate1RM } from '@/lib/aiPlanner';

interface SetRowProps {
  setIndex: number;
  set: WorkoutSet;
  previousSet?: WorkoutSet;
  onUpdate: (patch: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDelete: () => void;
  isCompleted: boolean;
  units: 'kg' | 'lbs';
}

function DeltaIndicator({
  current,
  previous,
}: {
  current: { weight: number; reps: number };
  previous: { weight: number; reps: number } | undefined;
}) {
  if (!previous) {
    return <Text className="text-xs text-text-muted w-16 text-center">Nouveau</Text>;
  }

  const currentScore  = calculate1RM(current.weight, current.reps);
  const previousScore = calculate1RM(previous.weight, previous.reps);
  const delta       = currentScore - previousScore;
  const weightDelta = current.weight - previous.weight;

  if (Math.abs(delta) < 0.5) {
    return <Text className="text-xs font-bold text-text-muted w-16 text-center">=</Text>;
  }

  const isUp  = delta > 0;
  const color = isUp ? colors.status.success : colors.status.danger;
  const arrow = isUp ? '▲' : '▼';
  const sign  = isUp ? '+' : '';

  return (
    <Text className="text-xs font-bold w-16 text-center" style={{ color }}>
      {arrow} {sign}{weightDelta.toFixed(1)}kg
    </Text>
  );
}

const SET_TYPES: SetType[] = ['warmup', 'normal', 'top', 'backoff', 'amrap', 'drop', 'failure'];

function SetTypePicker({ current, onChange }: { current: SetType; onChange: (t: SetType) => void }) {
  return (
    <View className="flex-row flex-wrap gap-1.5 py-2">
      {SET_TYPES.map((type) => (
        <Pressable
          key={type}
          onPress={() => onChange(type)}
          className={`px-2 py-1 rounded-md ${current === type ? 'opacity-100' : 'opacity-40'}`}
        >
          <SetTypeBadge setType={type} />
        </Pressable>
      ))}
    </View>
  );
}

export function SetRow({
  setIndex,
  set,
  previousSet,
  onUpdate,
  onComplete,
  onDelete,
  isCompleted,
  units,
}: SetRowProps) {
  const [showTypePicker, setShowTypePicker] = React.useState(false);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <View style={{ opacity: isCompleted ? 0.7 : 1 }}>
      <View
        className={`rounded-xl overflow-hidden ${isCompleted ? 'bg-white/[0.04]' : 'bg-white/[0.06]'}`}
        style={{ borderWidth: 1, borderColor: isCompleted ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)' }}
      >
        <View className="flex-row items-center gap-2 px-3 py-2.5">
          <Pressable
            onPress={() => setShowTypePicker((v) => !v)}
            className="w-7 h-7 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${colors.setType[set.setType]}20` }}
          >
            <Text className="text-xs font-bold" style={{ color: colors.setType[set.setType] }}>
              {setIndex + 1}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-1.5 flex-1">
            <NumericInput value={set.weight} onChange={(v) => onUpdate({ weight: v })} min={0} max={500} step={2.5} suffix={units} />
            <Text className="text-text-muted text-sm">×</Text>
            <NumericInput value={set.reps} onChange={(v) => onUpdate({ reps: v })} min={1} max={100} step={1} />
          </View>

          <DeltaIndicator
            current={{ weight: set.weight, reps: set.reps }}
            previous={previousSet}
          />

          <Pressable
            onPress={handleComplete}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: isCompleted ? colors.status.success : 'rgba(255,255,255,0.1)' }}
          >
            <Text className="text-sm font-bold text-white">{isCompleted ? '✓' : '○'}</Text>
          </Pressable>
        </View>

        {!isCompleted && (
          <View className="flex-row items-center gap-2 px-3 pb-2">
            <Text className="text-xs text-text-muted">RPE</Text>
            <View className="flex-row gap-1">
              {[6, 7, 8, 9, 10].map((rpe) => (
                <Pressable
                  key={rpe}
                  onPress={() => onUpdate({ rpe })}
                  className={`w-7 h-7 rounded-md items-center justify-center ${set.rpe === rpe ? 'bg-brand-primary' : 'bg-white/[0.08]'}`}
                >
                  <Text className={`text-xs font-semibold ${set.rpe === rpe ? 'text-white' : 'text-text-secondary'}`}>
                    {rpe}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {showTypePicker && (
          <View className="px-3 pb-2">
            <SetTypePicker
              current={set.setType}
              onChange={(type) => { onUpdate({ setType: type }); setShowTypePicker(false); }}
            />
          </View>
        )}
      </View>

      {previousSet && !isCompleted && (
        <View className="flex-row items-center gap-1 px-3 py-1">
          <Text className="text-xs text-text-muted">
            Dernière fois : {previousSet.weight}{units} × {previousSet.reps}
          </Text>
          <SetTypeBadge setType={previousSet.setType} />
        </View>
      )}
    </View>
  );
}
