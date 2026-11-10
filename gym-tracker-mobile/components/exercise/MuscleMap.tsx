import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import type { Muscle } from '@/domain/catalog/muscles';
import { colors } from '@/constants/theme';
import { BODY_BACK, BODY_FRONT, type BodyPart } from './bodyPaths';

// Not muscles: drawn plain, like skin
const PLAIN = new Set(['head', 'hair', 'hands', 'feet', 'ankles', 'knees', 'neck']);
// A drawing: it keeps its light look at night too, like the plates
const BASE = '#F3E9DF';
const SKIN = '#FFFFFF';
const HELPER = '#FFB9A3';
const MAIN = '#FF6B4A';

interface Props {
  primary: Muscle[];
  /** The muscles that help, lighter. */
  secondary: Muscle[];
  /** Read by the screen reader. */
  label: string;
  width: number;
}

function parts(list: BodyPart[], primary: string[], secondary: string[]) {
  return list.flatMap((part) => {
    const fill = primary.includes(part.slug)
      ? MAIN
      : secondary.includes(part.slug)
        ? HELPER
        : PLAIN.has(part.slug)
          ? SKIN
          : BASE;
    return part.paths.map((d, i) => (
      <Path key={`${part.slug}-${i}`} d={d} fill={fill} stroke={colors.drawn} strokeWidth={5} strokeLinejoin="round" />
    ));
  });
}

/** Front and back of a body, the main muscles in coral, the ones that help lighter. */
export function MuscleMap({ primary, secondary, label, width }: Props) {
  return (
    // Cropped to the drawing: front x 53-675, back x 773-1394 brought 60 closer
    <Svg width={width} height={width * (1260 / 1360)} viewBox="40 90 1360 1260" accessible accessibilityLabel={label}>
      <G>{parts(BODY_FRONT, primary, secondary)}</G>
      <G transform="translate(-60 0)">{parts(BODY_BACK, primary, secondary)}</G>
    </Svg>
  );
}
