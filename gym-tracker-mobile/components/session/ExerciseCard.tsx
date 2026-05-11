import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SetRow } from './SetRow';
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

const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  compound:  ['#7c3aed', '#06b6d4'],
  isolation: ['#06b6d4', '#10b981'],
  accessory: ['#f59e0b', '#ef4444'],
};

export function ExerciseCard({ exercise, lastWorkout, onStartRest }: ExerciseCardProps) {
  const { updateSet, addSet, removeSet, completeSet, toggleExerciseExpanded } = useSessionStore();
  const units           = useSettingsStore((s) => s.settings.units);
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);

  const prevExercise = lastWorkout?.exercises.find(
    (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
  );

  const completedCount  = exercise.sets.filter((s) => s.completed).length;
  const totalCount      = exercise.sets.length;
  const isAllDone       = completedCount === totalCount && totalCount > 0;
  const gradient        = CATEGORY_GRADIENT[exercise.category] ?? CATEGORY_GRADIENT.compound!;

  const handleSetComplete = useCallback(
    (setIndex: number) => {
      completeSet(exercise.id, setIndex);
      onStartRest(exercise.sets[setIndex]?.restTime ?? defaultRestTime);
    },
    [completeSet, exercise.id, exercise.sets, defaultRestTime, onStartRest],
  );

  const handleAddSet = useCallback(() => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: WorkoutSet = {
      reps:     lastSet?.reps ?? 8,
      weight:   lastSet?.weight ?? 0,
      setType:  lastSet?.setType ?? 'normal',
      restTime: defaultRestTime,
      completed: false,
    };
    addSet(exercise.id, newSet);
  }, [exercise.id, exercise.sets, addSet, defaultRestTime]);

  return (
    <View style={{ gap: 0 }}>
      {/* Header exercice */}
      <Pressable onPress={() => toggleExerciseExpanded(exercise.id)}>
        <View style={{ paddingVertical: 16, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Accent couleur catégorie */}
          <LinearGradient
            colors={isAllDone ? ['#10b981', '#059669'] : gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: 4, height: 48, borderRadius: 2 }}
          />

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: isAllDone ? colors.status.success : colors.text.primary, letterSpacing: -0.3 }}>
              {exercise.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {exercise.muscleGroups.slice(0, 3).map((m) => (
                <Text key={m} style={{ fontSize: 11, fontWeight: '600', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {MUSCLE_LABELS[m]}
                </Text>
              ))}
            </View>
          </View>

          {/* Compteur séries */}
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: isAllDone ? colors.status.success : colors.text.primary }}>
              {completedCount}
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.muted }}>/{totalCount}</Text>
            </Text>
            <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '600', letterSpacing: 0.3 }}>SÉRIES</Text>
          </View>
        </View>
      </Pressable>

      {/* Barre de progression */}
      <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4, borderRadius: 1, overflow: 'hidden' }}>
        {totalCount > 0 && (
          <LinearGradient
            colors={isAllDone ? ['#10b981', '#059669'] : gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${(completedCount / totalCount) * 100}%`, height: 2 }}
          />
        )}
      </View>

      {/* Corps — séries */}
      {exercise.isExpanded && (
        <View style={{ paddingTop: 12, gap: 8 }}>
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
            style={{
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: 'rgba(124,58,237,0.08)',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'rgba(124,58,237,0.30)',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand.primary }}>
              + Série
            </Text>
          </Pressable>
        </View>
      )}

      {/* Séparateur entre exercices */}
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 16 }} />
    </View>
  );
}
