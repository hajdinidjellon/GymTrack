import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors } from '@/constants/theme';
import { Text } from './Text';

/** The small ✕ that takes a row away: a 32 pt sticker in a 44 pt touch area. */
export function RemoveButton({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6 }}
    >
      {({ pressed }) => (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: border.base - 0.5,
            borderColor: colors.outline,
            backgroundColor: pressed ? colors.coralSoft : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size={14} weight="black" maxFontSizeMultiplier={1.2}>
            ✕
          </Text>
        </View>
      )}
    </Pressable>
  );
}
