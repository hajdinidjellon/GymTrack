import React from 'react';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, fonts, plateColor } from '@/constants/theme';
import { formatKg } from '@/domain/plates';

/** Diameter at size 1, close to the real ratio between plates (25 kg = 45 cm, 1,25 kg ≈ 16 cm). */
const DIAMETER: Record<string, number> = {
  '25': 1,
  '20': 0.96,
  '15': 0.88,
  '10': 0.8,
  '5': 0.66,
  '2.5': 0.54,
  '1.25': 0.44,
};

// Disques clairs : le texte passe en noir pour rester lisible
const LIGHT = new Set(['5', '15', '1.25']);

interface Props {
  kg: number;
  /** Diameter of a 25 kg plate, in points. */
  size: number;
  /** Faded and outlined when the gym does not have it. */
  off?: boolean;
}

/** A plate seen from the front: coloured face, raised rim, steel hub, centre hole, weight printed on it. */
export function PlateFace({ kg, size, off }: Props) {
  const d = size * (DIAMETER[String(kg)] ?? 0.5);
  const r = d / 2;
  const c = size / 2;
  const color = plateColor(kg);
  const ink = LIGHT.has(String(kg)) ? colors.bg : colors.cream;

  if (off) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r - 1} fill="none" stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 4" />
        <Circle cx={c} cy={c} r={r * 0.2} fill={colors.surfaceHigh} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      <G>
        <Circle cx={c} cy={c} r={r} fill={color} />
        {/* Rebord : un anneau un peu plus sombre au bord du disque */}
        <Circle cx={c} cy={c} r={r * 0.9} fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={r * 0.08} />
        <Circle cx={c} cy={c} r={r * 0.34} fill={colors.steel} />
        <Circle cx={c} cy={c} r={r * 0.16} fill={colors.bg} />
        {r >= 18 ? (
          <SvgText
            x={c}
            y={c - r * 0.5}
            fontSize={Math.max(8, r * 0.3)}
            fontFamily={fonts.black}
            fill={ink}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {formatKg(kg)}
          </SvgText>
        ) : null}
      </G>
    </Svg>
  );
}
