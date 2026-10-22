import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';

/** Height and thickness of each plate at scale 1, close to real proportions. */
const PLATE: Record<string, [number, number]> = {
  '25': [112, 18],
  '20': [104, 16],
  '15': [96, 15],
  '10': [88, 14],
  '5': [68, 11],
  '2.5': [54, 9],
  '1.25': [44, 7],
};

export function plateSize(kg: number, scale = 1): { height: number; width: number } {
  const [h, w] = PLATE[String(kg)] ?? [40, 6];
  return { height: Math.round(h * scale), width: Math.max(3, Math.round(w * scale)) };
}

interface Props {
  /** Plates on one side, heaviest first. */
  perSide: number[];
  scale?: number;
  barWidth?: number;
  /** Plates from this index on are drawn full, the ones before are faded (progress view). */
  highlightFrom?: number;
}

/** The bar seen from the front: sleeve, plates, collar, bar, mirrored. */
export function Barbell({ perSide, scale = 1, barWidth = 96, highlightFrom }: Props) {
  const plates = perSide.map((kg, i) => {
    const { height, width } = plateSize(kg, scale);
    const faded = highlightFrom != null && i < highlightFrom;
    return { kg, height, width, faded };
  });
  const tallest = Math.max(plateSize(20, scale).height, ...plates.map((p) => p.height));
  const sleeve = { width: Math.round(20 * scale), height: Math.max(4, Math.round(7 * scale)) };
  const collar = { width: Math.max(3, Math.round(5 * scale)), height: Math.round(26 * scale) };

  const side = (mirror: boolean) => {
    const list = mirror ? [...plates].reverse() : plates;
    return list.map((p, i) => (
      <View
        key={`${mirror ? 'l' : 'r'}${i}`}
        style={{
          width: p.width,
          height: p.height,
          borderRadius: Math.max(2, 4 * scale),
          backgroundColor: colors.cream,
          opacity: p.faded ? 0.4 : 1,
          marginHorizontal: 1,
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
      <View style={{ ...sleeve, backgroundColor: colors.steel, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />
      {side(true)}
      <View style={{ ...collar, borderRadius: 2, backgroundColor: colors.muted, marginHorizontal: 2 }} />
      <View style={{ width: barWidth, height: Math.max(4, Math.round(6 * scale)), backgroundColor: colors.steel }} />
      <View style={{ ...collar, borderRadius: 2, backgroundColor: colors.muted, marginHorizontal: 2 }} />
      {side(false)}
      <View style={{ ...sleeve, backgroundColor: colors.steel, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
    </View>
  );
}

/** Just one side, small: for list rows. */
export function MiniPlates({ perSide }: { perSide: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 48 }}>
      {perSide.map((kg, i) => {
        const { height, width } = plateSize(kg, 0.44);
        return (
          <View key={i} style={{ width: Math.max(4, width), height, borderRadius: 2, backgroundColor: colors.cream }} />
        );
      })}
      <View style={{ width: 14, height: 4, backgroundColor: colors.steel }} />
    </View>
  );
}
