import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: string;
}

const TREND_ICONS = { up: '▲', down: '▼', neutral: '—' } as const;
const TREND_COLORS = {
  up: '#10b981',
  down: '#ef4444',
  neutral: 'rgba(248,250,252,0.3)',
} as const;

export function StatCard({
  label,
  value,
  unit,
  sublabel,
  icon,
  trend,
  trendValue,
  accentColor,
}: StatCardProps) {
  return (
    <Card className="flex-1 gap-2" padding="md">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </Text>
        {icon && <View className="opacity-70">{icon}</View>}
      </View>

      <View className="flex-row items-baseline gap-1">
        <Text
          className="text-2xl font-bold text-text-primary"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {value}
        </Text>
        {unit && (
          <Text className="text-sm text-text-muted">{unit}</Text>
        )}
      </View>

      {(sublabel ?? trend) && (
        <View className="flex-row items-center gap-1.5">
          {trend && (
            <Text
              style={{
                color: TREND_COLORS[trend],
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {TREND_ICONS[trend]} {trendValue}
            </Text>
          )}
          {sublabel && (
            <Text className="text-xs text-text-muted">{sublabel}</Text>
          )}
        </View>
      )}
    </Card>
  );
}

// Variante large (full-width) pour les métriques principales
interface HeroStatProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  gradient?: boolean;
}

export function HeroStat({
  label,
  value,
  unit,
  description,
  gradient,
}: HeroStatProps) {
  return (
    <View className="items-center gap-1">
      <Text className="text-xs font-medium text-text-muted uppercase tracking-widest">
        {label}
      </Text>
      <View className="flex-row items-baseline gap-1">
        <Text
          className="text-5xl font-black"
          style={gradient ? { color: '#7c3aed' } : { color: '#f8fafc' }}
        >
          {value}
        </Text>
        {unit && (
          <Text className="text-xl font-medium text-text-secondary">{unit}</Text>
        )}
      </View>
      {description && (
        <Text className="text-sm text-text-muted text-center">{description}</Text>
      )}
    </View>
  );
}
