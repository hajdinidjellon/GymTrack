import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MuscleMapSVG, MuscleHeatmapList } from './MuscleMapSVG';
import { useMuscleLabels } from '@/lib/i18n';
import { getMuscleActivity } from '@/lib/gamification';
import type { MuscleGroup, Workout } from '@/types';

// Couleur basique pour le détail (sans dépendre de Skia)
function muscleDetailColor(intensity: number): string {
  if (intensity <= 0)  return 'rgba(255,255,255,0.06)';
  if (intensity < 25)  return 'rgba(147,197,253,0.6)';
  if (intensity < 60)  return 'rgba(251,191,36,0.75)';
  if (intensity < 85)  return 'rgba(249,115,22,0.85)';
  return 'rgba(239,68,68,0.95)';
}

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
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const muscleLabels = useMuscleLabels();
  const activity = getMuscleActivity(workouts, period);

  const handlePress = (muscle: MuscleGroup) => {
    setSelected((prev) => (prev === muscle ? null : muscle));
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Sélecteur période */}
      {onPeriodChange && (
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, alignSelf: 'flex-start' }}>
          {([7, 30] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => onPeriodChange(p)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: period === p ? '#7c3aed' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: period === p ? 'white' : 'rgba(248,250,252,0.55)' }}>
                {p === 7 ? '7 jours' : '30 jours'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Mannequin */}
      {!compact && (
        <View style={{ alignItems: 'center' }}>
          <MuscleMapSVG
            activity={activity}
            selected={selected}
            onMusclePress={handlePress}
            size="md"
            showBoth
            showLegend
          />
        </View>
      )}

      {/* Liste scrollable */}
      <MuscleHeatmapList
        activity={activity}
        selected={selected}
        onMusclePress={handlePress}
      />

      {/* Détail muscle sélectionné */}
      {selected && (
        <MuscleDetail muscle={selected} intensity={activity[selected] ?? 0} muscleLabels={muscleLabels} />
      )}
    </View>
  );
}

function MuscleDetail({ muscle, intensity, muscleLabels }: { muscle: MuscleGroup; intensity: number; muscleLabels: Record<MuscleGroup, string> }) {
  const color = muscleDetailColor(intensity);
  const status =
    intensity === 0   ? 'Aucun travail récent' :
    intensity < 25    ? 'Peu sollicité — bon à travailler' :
    intensity < 60    ? 'Modérément entraîné' :
    intensity < 85    ? 'Bien sollicité' :
                        'Très sollicité — laisser récupérer';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color, opacity: 0.8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#f8fafc' }}>
          {muscleLabels[muscle]}
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(248,250,252,0.55)' }}>{status}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color }}>
        {intensity}%
      </Text>
    </View>
  );
}
