import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors } from '@/constants/theme';
import { Text } from './Text';
import { Check } from './icons';
import { buzz } from './PressableScale';

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Smaller line under the label: what the choice applies to. */
  detail?: string;
}

/** A sticker checkbox with its label; the whole row is the touch target. */
export function CheckRow({ label, checked, onChange, detail }: Props) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          borderWidth: border.base,
          borderColor: colors.ink,
          backgroundColor: checked ? colors.success : colors.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Check size={16} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text size={15} weight="bold">
          {label}
        </Text>
        {detail ? (
          <Text size={13} weight="semibold" color={colors.inkMuted} style={{ lineHeight: 18 }}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
