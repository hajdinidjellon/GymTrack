import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { Text } from './Text';

/** Small caps label that opens a block of content. */
export function SectionTitle({ title, right, first }: { title: string; right?: React.ReactNode; first?: boolean }) {
  return (
    <View
      style={{
        marginTop: first ? 0 : space.xl + 4,
        marginBottom: space.sm + 2,
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}
    >
      <Text size={12} weight="black" color={colors.faint} accessibilityRole="header" style={{ letterSpacing: 1.3 }}>
        {title.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}
