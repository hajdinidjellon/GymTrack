import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/constants/theme';

interface Props {
  values: number[];
  height?: number;
  /** The last point gets a coral dot. */
  accent?: boolean;
}

/** A small line chart, filled underneath. Needs two points or more. */
export function Sparkline({ values, height = 64, accent = true }: Props) {
  const [width, setWidth] = useState(0);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 6;
  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1]!;
  const area = `${line} L${last.x.toFixed(1)},${height} L${pad},${height} Z`;

  return (
    <View accessible={false} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.coral} stopOpacity={0.3} />
              <Stop offset="1" stopColor={colors.coral} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#fill)" />
          <Path
            d={line}
            stroke={colors.ink}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle
            cx={last.x}
            cy={last.y}
            r={5}
            fill={accent ? colors.coral : colors.card}
            stroke={colors.ink}
            strokeWidth={2.5}
          />
        </Svg>
      ) : null}
    </View>
  );
}
