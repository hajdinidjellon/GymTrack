import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';
import { MUSCLE_LABELS } from '@/lib/gamification';
import type { MuscleGroup } from '@/types';

interface VolumeBarProps {
  data: Array<{ muscle: MuscleGroup; sets: number; volume: number }>;
  metric?: 'sets' | 'volume';
  height?: number;
}

export function VolumeBar({ data, metric = 'sets', height = 180 }: VolumeBarProps) {
  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center rounded-2xl bg-white/[0.04]">
        <Text className="text-text-muted text-sm">Aucun volume cette semaine</Text>
      </View>
    );
  }

  const values = data.map((d) => (metric === 'sets' ? d.sets : Math.round(d.volume / 10)));
  const maxVal = Math.max(...values, 1);

  return (
    <View style={{ height }} className="flex-row items-end gap-2 px-2">
      {data.map((d, i) => {
        const val  = values[i] ?? 0;
        const pct  = val / maxVal;
        const barH = Math.max(pct * (height - 30), 4);
        return (
          <View key={d.muscle} className="flex-1 items-center gap-1">
            <Text className="text-xs text-text-muted">{val}</Text>
            <View
              style={{
                width: '100%',
                height: barH,
                backgroundColor: colors.brand.primary,
                borderRadius: 4,
                opacity: 0.7 + pct * 0.3,
              }}
            />
            <Text className="text-xs text-text-muted" numberOfLines={1}>
              {MUSCLE_LABELS[d.muscle].slice(0, 3)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface MiniVolumeBarProps {
  muscle: MuscleGroup;
  sets: number;
  maxSets: number;
  recommended?: [number, number];
}

export function MiniVolumeBar({ muscle, sets, maxSets, recommended }: MiniVolumeBarProps) {
  const pct  = maxSets > 0 ? (sets / maxSets) * 100 : 0;
  const [minRec, maxRec] = recommended ?? [12, 20];
  const isUndertrained = sets < minRec;
  const isOvertrained  = sets > maxRec;
  const barColor = isUndertrained ? colors.status.danger : isOvertrained ? colors.status.warning : colors.status.success;

  return (
    <View className="flex-row items-center gap-2 py-1">
      <Text className="text-xs text-text-muted w-16" numberOfLines={1}>
        {MUSCLE_LABELS[muscle]}
      </Text>
      <View className="flex-1 h-1.5 rounded-full bg-white/[0.08]">
        <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: barColor }} />
      </View>
      <Text className="text-xs font-medium text-text-secondary w-8 text-right">{sets}</Text>
    </View>
  );
}
