import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { border, colors, hardShadow } from '@/constants/theme';
import { ChevronLeft } from './icons';
import { t } from '@/i18n';

export interface BackProps {
  onPress?: () => void;
  label?: string;
}

/** The round back arrow, the same on every screen. A pressed one sinks onto its shadow. */
export function BackButton({ onPress, label = t('common.back') }: BackProps) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        borderWidth: border.base,
        borderColor: colors.outline,
        alignItems: 'center',
        justifyContent: 'center',
        ...(pressed ? {} : hardShadow(2)),
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      <ChevronLeft size={22} />
    </Pressable>
  );
}
