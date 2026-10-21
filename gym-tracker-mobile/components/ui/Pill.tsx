import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { Text } from './Text';

export function Pill({ label }: { label: string }) {
  return (
    <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.cream, justifyContent: 'center' }}>
      <Text size={14} weight="black">{label}</Text>
    </View>
  );
}
