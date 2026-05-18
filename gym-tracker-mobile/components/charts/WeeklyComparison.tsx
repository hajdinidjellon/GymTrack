import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { BG_COLORS } from '@/components/ui/ScreenBackground';
import type { Workout } from '@/types';

/**
 * Compare cette semaine à la semaine dernière sur 3 métriques :
 * séances, volume (kg), sets totaux.
 *
 * Affiche le delta (+/-) avec couleur (green up, red down).
 */

interface WeeklyComparisonProps {
  workouts: Workout[];
}

function computeWeekStats(workouts: Workout[], start: Date, end: Date) {
  const inWeek = workouts.filter((w) =>
    isWithinInterval(new Date(w.date), { start, end })
  );
  const sessions = inWeek.length;
  const sets     = inWeek.reduce((t, w) =>
    t + w.exercises.reduce((s, e) => s + e.sets.length, 0)
  , 0);
  const volume   = inWeek.reduce((t, w) =>
    t + w.exercises.reduce((s, e) =>
      s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0)
    , 0)
  , 0);
  return { sessions, sets, volume };
}

function deltaPercent(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function formatDelta(curr: number, prev: number, isVolume = false): {
  text: string; color: string; icon: 'trending-up' | 'trending-down' | 'remove';
} {
  const diff = curr - prev;
  if (diff === 0) return { text: '=', color: 'rgba(255,255,255,0.40)', icon: 'remove' };

  const pct = deltaPercent(curr, prev);
  const sign = diff > 0 ? '+' : '';
  const formatted = isVolume
    ? `${sign}${(diff / 1000).toFixed(1)}t`
    : `${sign}${diff}`;

  return {
    text: prev === 0 ? formatted : `${sign}${pct.toFixed(0)}%`,
    color: diff > 0 ? '#34d399' : '#ef4444',
    icon: diff > 0 ? 'trending-up' : 'trending-down',
  };
}

export function WeeklyComparison({ workouts }: WeeklyComparisonProps) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd   = endOfWeek(subWeeks(now, 1),   { weekStartsOn: 1 });

  const current  = computeWeekStats(workouts, thisWeekStart, thisWeekEnd);
  const previous = computeWeekStats(workouts, lastWeekStart, lastWeekEnd);

  // Pas d'historique sur la semaine dernière → on n'affiche pas la card
  if (previous.sessions === 0 && current.sessions === 0) return null;

  const rows: Array<{
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    currValue: string;
    prevValue: string;
    delta: ReturnType<typeof formatDelta>;
  }> = [
    {
      label: 'Séances',
      icon: 'checkmark-done',
      color: BG_COLORS.accent,
      currValue: String(current.sessions),
      prevValue: String(previous.sessions),
      delta: formatDelta(current.sessions, previous.sessions),
    },
    {
      label: 'Volume',
      icon: 'barbell-outline',
      color: '#a78bfa',
      currValue: `${(current.volume / 1000).toFixed(1)}t`,
      prevValue: `${(previous.volume / 1000).toFixed(1)}t`,
      delta: formatDelta(current.volume, previous.volume, true),
    },
    {
      label: 'Sets',
      icon: 'layers-outline',
      color: '#fbbf24',
      currValue: String(current.sets),
      prevValue: String(previous.sets),
      delta: formatDelta(current.sets, previous.sets),
    },
  ];

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 22, borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 16, gap: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
          Cette semaine vs semaine dernière
        </Text>
      </View>

      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingVertical: 6,
          }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 11,
            backgroundColor: `${row.color}16`,
            borderWidth: 1, borderColor: `${row.color}30`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={row.icon} size={16} color={row.color} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {row.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.6 }}>
                {row.currValue}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', fontWeight: '700' }}>
                vs {row.prevValue}
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
            backgroundColor: `${row.delta.color}14`,
            borderWidth: 1, borderColor: `${row.delta.color}28`,
          }}>
            <Ionicons name={row.delta.icon} size={12} color={row.delta.color} />
            <Text style={{ fontSize: 12, fontWeight: '900', color: row.delta.color, letterSpacing: 0.3 }}>
              {row.delta.text}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
