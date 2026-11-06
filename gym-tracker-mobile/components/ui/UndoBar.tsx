import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { border, colors, hardShadow, radius } from '@/constants/theme';
import { Text } from './Text';

interface Props {
  /** "Retiré : Squat". */
  message: string;
  actionLabel: string;
  actionA11y: string;
  onUndo: () => void;
}

/** What was just removed, with a way back. It stays until the next change: no timer to beat. */
export function UndoBar({ message, actionLabel, actionA11y, onUndo }: Props) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        minHeight: 52,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: radius.pill,
        borderWidth: border.base,
        borderColor: colors.frame,
        backgroundColor: colors.card,
        ...hardShadow(2),
      }}
    >
      <Text size={15} weight="bold" style={{ flex: 1 }} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        accessibilityLabel={actionA11y}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.coralSoft : 'transparent',
        })}
      >
        <Text size={15} weight="black" style={{ textDecorationLine: 'underline' }}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}
