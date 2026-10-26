import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, hardShadow } from '@/constants/theme';
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
        <ChevronLeft size={24} />
      </Arrow>
      <Pressable
        onLongPress={onLongPress}
        disabled={!onLongPress}
        accessibilityHint={onLongPress ? 'Appui long pour saisir les reps faites' : undefined}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
      >
        <Text size={60} weight="black" style={{ lineHeight: 70 }}>
          {value}
        </Text>
        <Text size={18} weight="titleMedium" color={colors.inkMuted}>
          {unit}
        </Text>
      </Pressable>
      <Arrow onPress={onPlus} label={plusLabel}>
        <ChevronRight size={24} />
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
      hitSlop={6}
      style={({ pressed }) => ({
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: border.base,
        borderColor: colors.ink,
        backgroundColor: colors.card,
        ...(pressed ? {} : hardShadow(2)),
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      {children}
    </Pressable>
  );
}
