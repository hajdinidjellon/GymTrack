import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export function TimerRing({ elapsedSeconds, size = 64, strokeWidth = 4, color = colors.brand.primary }: TimerRingProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute', width: size, height: size,
          borderRadius: size / 2, borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      />
      <View
        style={{
          position: 'absolute', width: size, height: size,
          borderRadius: size / 2, borderWidth: strokeWidth,
          borderColor: 'transparent', borderTopColor: color,
          transform: [{ rotate: `${(elapsedSeconds % 60) * 6}deg` }],
        }}
      />
      <Text style={{ fontWeight: '900', color: colors.text.primary, fontSize: size * 0.22 }}>
        {formatDuration(elapsedSeconds)}
      </Text>
    </View>
  );
}

export function SessionTimer({ elapsedSeconds }: { elapsedSeconds: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {/* Dot pulsant gradient */}
      <LinearGradient
        colors={['#10b981', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 8, height: 8, borderRadius: 4,
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text.primary, letterSpacing: 1 }}>
        {formatDuration(elapsedSeconds)}
      </Text>
    </View>
  );
}
