import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/constants/theme';
import { ChevronLeft, ChevronRight } from './icons';
import { Text } from './Text';

interface Props {
  value: string;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  minusLabel: string;
  plusLabel: string;
  onLongPress?: () => void;
}

/** A huge number with arrows each side. Tapping the arrows nudges it by one step. */
export function Stepper({ value, unit, onMinus, onPlus, minusLabel, plusLabel, onLongPress }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Arrow onPress={onMinus} label={minusLabel}>
        <ChevronLeft color={colors.muted} />
      </Arrow>
      <Pressable
        onLongPress={onLongPress}
        disabled={!onLongPress}
        accessibilityHint={onLongPress ? 'Appui long pour saisir les reps faites' : undefined}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
      >
        <Text size={84} weight="black" style={{ lineHeight: 92 }}>{value}</Text>
        <Text size={20} weight="semibold" color={colors.muted}>{unit}</Text>
      </Pressable>
      <Arrow onPress={onPlus} label={plusLabel}>
        <ChevronRight color={colors.muted} />
      </Arrow>
    </View>
  );
}

function Arrow({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 56, height: 88, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
    >
      {children}
    </Pressable>
  );
}
