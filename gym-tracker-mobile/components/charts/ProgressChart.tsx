import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { colors } from '@/constants/theme';
import type { ProgressionDataPoint } from '@/types';

interface ProgressChartProps {
  data: ProgressionDataPoint[];
  exerciseName: string;
  metric?: 'estimated1RM' | 'maxWeight' | 'totalVolume';
  height?: number;
}

export function ProgressChart({
  data,
  metric = 'estimated1RM',
  height = 220,
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center rounded-2xl bg-white/[0.04]">
        <Text className="text-text-muted text-sm">Pas encore de données</Text>
      </View>
    );
  }

  const values = data.map((d) =>
    metric === 'estimated1RM' ? d.estimated1RM : metric === 'maxWeight' ? d.maxWeight : d.totalVolume,
  );

  const latestValue = values[values.length - 1] ?? 0;
  const firstValue  = values[0] ?? 0;
  const trend       = latestValue - firstValue;
  const trendColor  = trend >= 0 ? colors.status.success : colors.status.danger;

  const metricLabel =
    metric === 'estimated1RM' ? '1RM estimé (kg)' : metric === 'maxWeight' ? 'Poids max (kg)' : 'Volume (kg)';

  // Calcul du graphique
  const W = 320;
  const H = height - 60;
  const PADDING = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range  = maxVal - minVal || 1;

  const points = values.map((v, i) => ({
    x: PADDING.left + (i / Math.max(values.length - 1, 1)) * chartW,
    y: PADDING.top + chartH - ((v - minVal) / range) * chartH,
    value: v,
    date: data[i]?.date ?? '',
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-text-muted">{metricLabel}</Text>
          <Text className="text-2xl font-bold text-text-primary">
            {latestValue.toFixed(1)} kg
          </Text>
        </View>
        {trend !== 0 && (
          <Text className="text-sm font-semibold" style={{ color: trendColor }}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
        )}
      </View>

      <View className="flex-row justify-between">
        {data[0] && (
          <Text className="text-xs text-text-muted">
            {format(parseISO(data[0].date), 'd MMM', { locale: fr })}
          </Text>
        )}
        {data.length > 1 && data[data.length - 1] && (
          <Text className="text-xs text-text-muted">
            {format(parseISO(data[data.length - 1]!.date), 'd MMM', { locale: fr })}
          </Text>
        )}
      </View>

      <Svg width={W} height={H}>
        {/* Grille horizontale */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PADDING.top + chartH * (1 - t);
          const val = minVal + range * t;
          return (
            <React.Fragment key={t}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={W - PADDING.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                fill={colors.text.muted}
                fontSize={9}
                textAnchor="end"
              >
                {val.toFixed(0)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Ligne de progression */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.brand.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points de données */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={colors.brand.primary}
          />
        ))}
      </Svg>
    </View>
  );
}
