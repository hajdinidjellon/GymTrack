import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MuscleMapSVG, MuscleHeatmapList } from './MuscleMapSVG';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { getMuscleHeatColor } from '@/constants/theme';
import type { MuscleGroup, Workout } from '@/types';
import { getMuscleActivity } from '@/lib/gamification';

interface MuscleHeatmapProps {
  workouts: Workout[];
  period?: 7 | 30;
  onPeriodChange?: (period: 7 | 30) => void;
  compact?: boolean;
}

export function MuscleHeatmap({
  workouts,
  period = 7,
  onPeriodChange,
  compact = false,
}: MuscleHeatmapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const activity = getMuscleActivity(workouts, period);

  const handleMusclePress = (muscle: MuscleGroup) => {
    setSelectedMuscle((prev) => (prev === muscle ? null : muscle));
  };

  return (
    <View className="gap-4">
      {/* Sélecteur période */}
      {onPeriodChange && (
        <View className="flex-row bg-white/[0.06] rounded-xl p-1 self-start">
          {([7, 30] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => onPeriodChange(p)}
              className={`px-4 py-1.5 rounded-lg ${period === p ? 'bg-brand-primary' : ''}`}
            >
              <Text
                className={`text-sm font-medium ${period === p ? 'text-white' : 'text-text-secondary'}`}
              >
                {p === 7 ? '7 jours' : '30 jours'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Mannequin */}
      {!compact && (
        <View className="items-center">
          <MuscleMapSVG
            muscleActivity={activity}
            onMusclePress={handleMusclePress}
            selectedMuscle={selectedMuscle}
            view="both"
            width={140}
            showLegend
          />
        </View>
      )}

      {/* Liste scrollable des muscles */}
      <MuscleHeatmapList
        muscleActivity={activity}
        onMusclePress={handleMusclePress}
        selectedMuscle={selectedMuscle}
      />

      {/* Détail muscle sélectionné */}
      {selectedMuscle && (
        <MuscleDetail muscle={selectedMuscle} intensity={activity[selectedMuscle] ?? 0} />
      )}
    </View>
  );
}

function MuscleDetail({
  muscle,
  intensity,
}: {
  muscle: MuscleGroup;
  intensity: number;
}) {
  const color = getMuscleHeatColor(intensity);
  const status =
    intensity === 0
      ? 'Aucun travail récent'
      : intensity < 25
        ? 'Peu sollicité — bon à travailler'
        : intensity < 60
          ? 'Modérément entraîné'
          : intensity < 85
            ? 'Bien sollicité'
            : 'Très sollicité — laisser récupérer';

  return (
    <View
      className="flex-row items-center gap-3 p-3 rounded-xl bg-white/[0.06]"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text-primary">
          {MUSCLE_LABELS[muscle]}
        </Text>
        <Text className="text-sm text-text-secondary">{status}</Text>
      </View>
      <Text className="text-xl font-bold" style={{ color }}>
        {intensity}%
      </Text>
    </View>
  );
}
