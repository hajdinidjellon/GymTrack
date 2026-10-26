import React from 'react';
import { View } from 'react-native';
import { colors, plateColor } from '@/constants/theme';

/** Height and thickness of each plate at scale 1, close to real proportions. */
const PLATE: Record<string, [number, number]> = {
  '25': [112, 20],
  '20': [104, 19],
  '15': [96, 17],
  '10': [88, 16],
  '5': [68, 13],
  '2.5': [54, 11],
  '1.25': [44, 9],
};

export function plateSize(kg: number, scale = 1): { height: number; width: number } {
  const [h, w] = PLATE[String(kg)] ?? [40, 8];
  return { height: Math.round(h * scale), width: Math.max(5, Math.round(w * scale)) };
}

/** Outline thickness: 2,5 like everything else, thinner when the drawing is small. */
function stroke(scale: number) {
  return scale >= 0.7 ? 2.5 : scale >= 0.45 ? 2 : 1.5;
}

interface Props {
  /** Plates on one side, heaviest first. */
  perSide: number[];
  scale?: number;
  barWidth?: number;
  /** Plates from this index on are drawn full, the ones before are faded (progress view). */
  highlightFrom?: number;
}

/** The bar seen from the front, like a sticker: sleeve, plates, collar, bar, mirrored. */
export function Barbell({ perSide, scale = 1, barWidth = 96, highlightFrom }: Props) {
  const line = stroke(scale);
  const plates = perSide.map((kg, i) => {
    const { height, width } = plateSize(kg, scale);
    const faded = highlightFrom != null && i < highlightFrom;
    return { kg, height, width, faded };
  });
  const tallest = Math.max(plateSize(20, scale).height, ...plates.map((p) => p.height));
  const sleeve = { width: Math.round(22 * scale), height: Math.max(8, Math.round(14 * scale)) };
  const collar = { width: Math.max(5, Math.round(8 * scale)), height: Math.round(28 * scale) };
  const steel = { backgroundColor: colors.steel, borderWidth: line, borderColor: colors.ink };

  const side = (mirror: boolean) => {
    const list = mirror ? [...plates].reverse() : plates;
    return list.map((p, i) => (
      <View
        key={`${mirror ? 'l' : 'r'}${i}`}
        style={{
          width: p.width,
          height: p.height,
          borderRadius: Math.max(3, p.width * 0.4),
          backgroundColor: p.faded ? colors.paper : plateColor(p.kg),
          borderWidth: line,
          borderColor: p.faded ? colors.line : colors.ink,
          borderStyle: p.faded ? 'dashed' : 'solid',
          // Les disques se chevauchent un peu, comme des autocollants
          marginLeft: i === 0 ? 0 : -line,
        }}
      />
    ));
  };

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ height: tallest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ ...sleeve, ...steel, borderRadius: sleeve.height / 2, marginRight: -line }} />
      {side(true)}
      <View style={{ ...collar, ...steel, borderRadius: 3, marginLeft: -line }} />
      <View
        style={{
          width: barWidth,
          height: Math.max(8, Math.round(12 * scale)),
          backgroundColor: colors.steel,
          borderTopWidth: line,
          borderBottomWidth: line,
          borderColor: colors.ink,
        }}
      />
      <View style={{ ...collar, ...steel, borderRadius: 3, marginRight: -line }} />
      {side(false)}
      <View style={{ ...sleeve, ...steel, borderRadius: sleeve.height / 2, marginLeft: -line }} />
    </View>
  );
}

/** Just one side, small: for list rows. */
export function MiniPlates({ perSide }: { perSide: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 48 }}>
      {perSide.map((kg, i) => {
        const { height, width } = plateSize(kg, 0.44);
        return (
          <View
            key={i}
            style={{
              width: Math.max(7, width),
              height,
              marginLeft: i === 0 ? 0 : -1.5,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: colors.ink,
              backgroundColor: plateColor(kg),
            }}
          />
        );
      })}
      <View
        style={{
          width: 16,
          height: 7,
          marginLeft: -1.5,
          backgroundColor: colors.steel,
          borderWidth: 1.5,
          borderColor: colors.ink,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
        }}
      />
    </View>
  );
}
