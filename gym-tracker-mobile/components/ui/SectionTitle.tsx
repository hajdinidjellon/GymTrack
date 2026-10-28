import React from 'react';
import { View } from 'react-native';
import { space } from '@/constants/theme';
import { Text } from './Text';

/** The title that opens a block of content. Sentence case, never capitals. */
export function SectionTitle({ title, right, first }: { title: string; right?: React.ReactNode; first?: boolean }) {
  return (
    <View
      style={{
        marginTop: first ? 0 : space.xl + 4,
        marginBottom: space.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text size={19} weight="black" accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}
