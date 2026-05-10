import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TimerRingProps {
  elapsedSeconds: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function TimerRing({
  elapsedSeconds,
  size = 64,
  strokeWidth = 4,
  color = colors.brand.primary,
}: TimerRingProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          transform: [{ rotate: `${(elapsedSeconds % 60) * 6}deg` }],
        }}
      />
      <Text className="font-bold text-text-primary" style={{ fontSize: size * 0.22 }}>
        {formatDuration(elapsedSeconds)}
      </Text>
    </View>
  );
}

export function SessionTimer({ elapsedSeconds }: { elapsedSeconds: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.status.success }} />
      <Text className="text-base font-bold text-text-primary">{formatDuration(elapsedSeconds)}</Text>
    </View>
  );
}
