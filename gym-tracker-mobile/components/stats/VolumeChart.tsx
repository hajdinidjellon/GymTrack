import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { formatThousands } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import type { WeekVolume } from '@/domain/stats';
import { Text } from '@/components/ui/Text';

const HEIGHT = 120;

/** One bar per week, inked. The current week is coral, the best week gets its number. */
export function VolumeChart({ weeks }: { weeks: WeekVolume[] }) {
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...weeks.map((w) => w.tonnage));
  const gap = 8;
  const bar = width ? (width - gap * (weeks.length - 1)) / weeks.length : 0;
  const bestIndex = weeks.reduce((best, w, i) => (w.tonnage > (weeks[best]?.tonnage ?? 0) ? i : best), 0);
  const label = weeks
    .map((w) => `semaine du ${w.start.getDate()}/${w.start.getMonth() + 1} : ${formatThousands(w.tonnage)} kg`)
    .join(', ');

  return (
    <View accessible accessibilityLabel={`Volume par semaine. ${label}`}>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width ? (
          <Svg width={width} height={HEIGHT}>
            <Line x1={0} x2={width} y1={HEIGHT - 1} y2={HEIGHT - 1} stroke={colors.ink} strokeWidth={2} />
            {weeks.map((w, i) => {
              const h = w.tonnage ? Math.max(8, (w.tonnage / max) * (HEIGHT - 24)) : 0;
              const current = i === weeks.length - 1;
              if (!h) return null;
              return (
                <Rect
                  key={i}
                  x={i * (bar + gap) + 1.25}
                  y={HEIGHT - h}
                  width={Math.max(0, bar - 2.5)}
                  height={h}
                  rx={Math.min(6, bar / 2)}
                  fill={current ? colors.coral : i === bestIndex ? colors.sun : colors.card}
                  stroke={colors.ink}
                  strokeWidth={2.5}
                />
              );
            })}
          </Svg>
        ) : null}
        {width && weeks[bestIndex]?.tonnage ? (
          <Text
            size={12}
            weight="black"
            style={{
              position: 'absolute',
              left: Math.max(0, Math.min(width - 60, bestIndex * (bar + gap) + bar / 2 - 30)),
              width: 60,
              textAlign: 'center',
              top: HEIGHT - Math.max(8, (weeks[bestIndex]!.tonnage / max) * (HEIGHT - 24)) - 20,
            }}
          >
            {formatKg(Math.round(weeks[bestIndex]!.tonnage / 100) / 10)} t
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text size={13} color={colors.inkFaint}>
          il y a {weeks.length - 1} sem.
        </Text>
        <Text size={13} weight="bold">
          cette semaine
        </Text>
      </View>
    </View>
  );
}
