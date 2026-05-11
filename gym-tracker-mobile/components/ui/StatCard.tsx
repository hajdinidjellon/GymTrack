import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

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
  const valueColor = accentColor ?? colors.text.primary;

  return (
    <View
      className="flex-1 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.bg.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Accent line top */}
      <LinearGradient
        colors={accentColor ? [accentColor, accentColor + '88'] : ['#7c3aed', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 2 }}
      />

      <View className="p-3 gap-1.5">
        {/* Label + icon */}
        <View className="flex-row items-center justify-between">
          <Text
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: colors.text.muted }}
          >
            {label}
          </Text>
          {icon && <View style={{ opacity: 0.85 }}>{icon}</View>}
        </View>

        {/* Valeur principale */}
        <View className="flex-row items-baseline gap-1">
          <Text
            style={{
              fontSize: 32,
              fontWeight: '900',
              color: valueColor,
              lineHeight: 36,
            }}
          >
            {value}
          </Text>
          {unit && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text.muted,
                marginBottom: 2,
              }}
            >
              {unit}
            </Text>
          )}
        </View>

        {/* Trend / sublabel */}
        {(sublabel ?? trend) && (
          <View className="flex-row items-center gap-1">
            {trend && (
              <Text
                style={{
                  color: TREND_COLORS[trend],
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                {TREND_ICONS[trend]} {trendValue}
              </Text>
            )}
            {sublabel && (
              <Text style={{ fontSize: 11, color: colors.text.muted }}>
                {sublabel}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

interface HeroStatProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  gradient?: boolean;
}

export function HeroStat({ label, value, unit, description, gradient }: HeroStatProps) {
  return (
    <View className="items-center gap-1">
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: colors.text.muted,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline gap-1">
        <Text
          style={{
            fontSize: 56,
            fontWeight: '900',
            color: gradient ? colors.brand.primary : colors.text.primary,
            lineHeight: 60,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={{ fontSize: 20, fontWeight: '500', color: colors.text.secondary }}
          >
            {unit}
          </Text>
        )}
      </View>
      {description && (
        <Text
          style={{ fontSize: 13, color: colors.text.muted, textAlign: 'center' }}
        >
          {description}
        </Text>
      )}
    </View>
  );
}
