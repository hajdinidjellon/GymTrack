import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SetRow } from './SetRow';
import { Chip } from '@/components/ui/Badge';
import { colors } from '@/constants/theme';
import { MUSCLE_LABELS } from '@/lib/gamification';
import type { ActiveExercise, WorkoutSet, Workout } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ExerciseCardProps {
  exercise: ActiveExercise;
  lastWorkout: Workout | undefined;
  onStartRest: (seconds: number) => void;
}

export function ExerciseCard({
  exercise,
  lastWorkout,
  onStartRest,
}: ExerciseCardProps) {
  const { updateSet, addSet, removeSet, completeSet, toggleExerciseExpanded } = useSessionStore();
  const units           = useSettingsStore((s) => s.settings.units);
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);

  const prevExercise = lastWorkout?.exercises.find(
    (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
  );

  const completedCount  = exercise.sets.filter((s) => s.completed).length;
  const totalCount      = exercise.sets.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = useCallback(() => {
    toggleExerciseExpanded(exercise.id);
  }, [exercise.id, toggleExerciseExpanded]);

  const handleSetComplete = useCallback(
    (setIndex: number) => {
      completeSet(exercise.id, setIndex);
      const restTime = exercise.sets[setIndex]?.restTime ?? defaultRestTime;
      onStartRest(restTime);
    },
    [completeSet, exercise.id, exercise.sets, defaultRestTime, onStartRest],
  );

  const handleAddSet = useCallback(() => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: WorkoutSet = {
      reps: lastSet?.reps ?? 8,
      weight: lastSet?.weight ?? 0,
      setType: lastSet?.setType ?? 'normal',
      restTime: defaultRestTime,
      completed: false,
    };
    addSet(exercise.id, newSet);
  }, [exercise.id, exercise.sets, addSet, defaultRestTime]);

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <Pressable onPress={handleToggle}>
        <View className="bg-white/[0.05] px-4 py-3">
          {/* Barre de progression */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 2,
              width: `${progressPercent}%`,
              backgroundColor: colors.status.success,
            }}
          />

          <View className="flex-row items-center gap-3">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
            >
              <Text className="text-base">
                {exercise.category === 'compound' ? '🏋️' :
                 exercise.category === 'isolation' ? '💪' : '⚡'}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-text-primary">
                {exercise.name}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                {exercise.muscleGroups.slice(0, 2).map((m) => (
                  <Chip key={m} label={MUSCLE_LABELS[m]} size="sm" variant="brand" />
                ))}
              </View>
            </View>

            <View className="items-end gap-1">
              <Text className="text-xs text-text-muted">
                {completedCount}/{totalCount} séries
              </Text>
              <Text className="text-sm">{exercise.isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>

          {prevExercise && (
            <View className="mt-2 flex-row items-center gap-1">
              <Text className="text-xs text-text-muted">
                Dernière fois : {prevExercise.sets.length} séries, top set{' '}
                {Math.max(...prevExercise.sets.map((s) => s.weight))}{units}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Corps */}
      {exercise.isExpanded && (
        <View className="px-3 py-2 gap-2 bg-bg-primary">
          {exercise.sets.map((set, index) => (
            <SetRow
              key={index}
              setIndex={index}
              set={set}
              previousSet={prevExercise?.sets[index]}
              onUpdate={(patch) => updateSet(exercise.id, index, patch)}
              onComplete={() => handleSetComplete(index)}
              onDelete={() => removeSet(exercise.id, index)}
              isCompleted={set.completed === true}
              units={units}
            />
          ))}

          <Pressable
            onPress={handleAddSet}
            className="flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] mt-1"
          >
            <Text className="text-sm font-medium text-brand-primary">
              + Ajouter une série
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
