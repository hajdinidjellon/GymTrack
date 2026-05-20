import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { BG_COLORS } from '@/components/ui/ScreenBackground';
import { useT } from '@/lib/i18n';
import type { Workout } from '@/types';

interface WeeklyComparisonProps {
  workouts: Workout[];
  target: number;
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

function formatDelta(curr: number, prev: number, upcoming: string, inProgress: string, isVolume = false): {
  text: string; color: string; icon: 'trending-up' | 'time-outline' | 'remove';
} {
  if (curr === 0) return { text: upcoming, color: 'rgba(255,255,255,0.35)', icon: 'remove' };

  const diff = curr - prev;
  if (diff === 0) return { text: '=', color: 'rgba(255,255,255,0.40)', icon: 'remove' };

  if (diff > 0) {
    const pct  = prev === 0 ? null : (diff / prev) * 100;
    const sign = '+';
    const text = pct !== null
      ? `${sign}${pct.toFixed(0)}%`
      : isVolume
        ? `${sign}${(diff / 1000).toFixed(1)}t`
        : `${sign}${diff}`;
    return { text, color: '#34d399', icon: 'trending-up' };
  }

  return { text: inProgress, color: '#fbbf24', icon: 'time-outline' };
}

export function WeeklyComparison({ workouts, target }: WeeklyComparisonProps) {
  const t             = useT();
  const now           = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd   = endOfWeek(subWeeks(now, 1),   { weekStartsOn: 1 });

  const current  = computeWeekStats(workouts, thisWeekStart, thisWeekEnd);
  const previous = computeWeekStats(workouts, lastWeekStart, lastWeekEnd);

  if (previous.sessions === 0 && current.sessions === 0) return null;

  const goalMet      = current.sessions >= target;
  const remaining    = Math.max(0, target - current.sessions);
  const sessionColor = goalMet ? '#34d399' : current.sessions > 0 ? '#fbbf24' : 'rgba(255,255,255,0.40)';
  const sessionIcon: 'checkmark-circle' | 'time-outline' | 'remove-circle' =
    goalMet ? 'checkmark-circle' : current.sessions > 0 ? 'time-outline' : 'remove-circle';

  const upcoming    = t('weekly.upcoming');
  const inProgress  = t('weekly.inProgress');

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 22, borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 16, gap: 12,
    }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
        {t('weekly.title')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: `${BG_COLORS.accent}16`,
          borderWidth: 1, borderColor: `${BG_COLORS.accent}30`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="checkmark-done" size={16} color={BG_COLORS.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {t('weekly.sessions')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.6 }}>
              {current.sessions}
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', fontWeight: '700' }}>
                /{target}
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', fontWeight: '600' }}>
              {t('weekly.goal')}
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
          backgroundColor: `${sessionColor}14`,
          borderWidth: 1, borderColor: `${sessionColor}28`,
        }}>
          <Ionicons name={sessionIcon} size={12} color={sessionColor} />
          <Text style={{ fontSize: 12, fontWeight: '900', color: sessionColor, letterSpacing: 0.3 }}>
            {goalMet
              ? t('weekly.reached')
              : remaining === 1
                ? t('weekly.remaining1')
                : t('weekly.remaining', { n: remaining })}
          </Text>
        </View>
      </View>

      {[
        {
          label: 'Volume',
          icon: 'barbell-outline' as const,
          color: '#a78bfa',
          currValue: `${(current.volume / 1000).toFixed(1)}t`,
          prevValue: `${(previous.volume / 1000).toFixed(1)}t`,
          delta: formatDelta(current.volume, previous.volume, upcoming, inProgress, true),
          hide: current.volume === 0 && previous.volume === 0,
        },
        {
          label: 'Sets',
          icon: 'layers-outline' as const,
          color: '#fbbf24',
          currValue: String(current.sets),
          prevValue: String(previous.sets),
          delta: formatDelta(current.sets, previous.sets, upcoming, inProgress),
          hide: current.sets === 0 && previous.sets === 0,
        },
      ].filter((r) => !r.hide).map((row) => (
        <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
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
