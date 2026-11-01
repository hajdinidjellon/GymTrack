import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from './icons';
import { t } from '@/i18n';

export function BackButton({ onPress, label = t('common.back') }: { onPress?: () => void; label?: string }) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{ width: 48, height: 48, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}
    >
      <ChevronLeft />
    </Pressable>
  );
}
