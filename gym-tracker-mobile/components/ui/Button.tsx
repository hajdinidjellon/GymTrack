import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Text } from './Text';

type Variant = 'primary' | 'outline' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** 72 by default; 96 for the set validation button. */
  height?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const textColor: Record<Variant, string> = {
  primary: colors.bg,
  outline: colors.cream,
  ghost: colors.cream,
};

export function Button({
  label,
  onPress,
  onLongPress,
  variant = 'primary',
  height = 72,
  icon,
  disabled,
  style,
  accessibilityLabel,
  testID,
}: Props) {
  const fontSize = height >= 90 ? 25 : height >= 70 ? 21 : 17;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 12,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        variant === 'primary' && { backgroundColor: pressed ? '#E2DAC6' : colors.cream },
        variant === 'outline' && { borderWidth: 2, borderColor: colors.cream },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text size={fontSize} weight={variant === 'ghost' ? 'bold' : 'black'} color={textColor[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}
