import React from 'react';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, fonts, plateColor, plateInk } from '@/constants/theme';
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

interface Props {
  kg: number;
  /** Diameter of a 25 kg plate, in points. */
  size: number;
  /** Faded and outlined when the gym does not have it. */
  off?: boolean;
}

/** A plate seen from the front, inked like a sticker: coloured face, rim, steel hub, centre hole, weight on it. */
export function PlateFace({ kg, size, off }: Props) {
  const d = size * (DIAMETER[String(kg)] ?? 0.5);
  const r = d / 2 - 1.5;
  const c = size / 2;
  const color = plateColor(kg);
  const ink = plateInk(kg);

  if (off) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={colors.line} strokeWidth={2} strokeDasharray="5 4" />
        <Circle cx={c} cy={c} r={r * 0.2} fill="none" stroke={colors.line} strokeWidth={2} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      <G>
        <Circle cx={c} cy={c} r={r} fill={color} stroke={colors.ink} strokeWidth={2.5} />
        {/* Rebord : un fin anneau à l'encre */}
        <Circle cx={c} cy={c} r={r * 0.82} fill="none" stroke={colors.ink} strokeOpacity={0.25} strokeWidth={1.5} />
        <Circle cx={c} cy={c} r={r * 0.34} fill={colors.steel} stroke={colors.ink} strokeWidth={2} />
        <Circle cx={c} cy={c} r={r * 0.14} fill={colors.paper} stroke={colors.ink} strokeWidth={1.5} />
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
