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
        <ChevronLeft size={24} color={colors.cream} />
      </Arrow>
      <Pressable
        onLongPress={onLongPress}
        disabled={!onLongPress}
        accessibilityHint={onLongPress ? 'Appui long pour saisir les reps faites' : undefined}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
      >
        <Text size={64} weight="black" style={{ lineHeight: 72 }}>
          {value}
        </Text>
        <Text size={17} weight="semibold" color={colors.muted}>
          {unit}
        </Text>
      </Pressable>
      <Arrow onPress={onPlus} label={plusLabel}>
        <ChevronRight size={24} color={colors.cream} />
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
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.line : colors.surfaceHigh,
      })}
    >
      {children}
    </Pressable>
  );
}
