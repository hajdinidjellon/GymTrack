import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { PressableScale, type HapticKind } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** 60 by default; 80 for the set validation button. */
  height?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  haptic?: HapticKind;
}

const look: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.cream, fg: colors.bg },
  secondary: { bg: colors.surfaceHigh, fg: colors.cream },
  outline: { bg: 'transparent', fg: colors.cream, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.muted },
};

export function Button({
  label,
  onPress,
  onLongPress,
  variant = 'primary',
  height = 60,
  icon,
  disabled,
  style,
  accessibilityLabel,
  testID,
  haptic,
}: Props) {
  const { bg, fg, border } = look[variant];
  const fontSize = height >= 76 ? 22 : height >= 56 ? 18 : 16;
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      haptic={haptic}
      scaleTo={0.96}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        {
          height,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          backgroundColor: bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text size={fontSize} weight={variant === 'ghost' ? 'bold' : 'black'} color={fg}>
        {label}
      </Text>
    </PressableScale>
  );
}
