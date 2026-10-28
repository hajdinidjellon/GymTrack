import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { border, colors, hardShadow, radius, text } from '@/constants/theme';
import { buzz, type HapticKind } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'xl' | 'large' | 'small';

interface Props {
  label: string;
  onPress: () => void;
  /** `primary` is coral: one per screen, for the main action. */
  variant?: Variant;
  /** `xl` is for the set validation button only. */
  size?: Size;
  icon?: React.ReactNode;
  disabled?: boolean;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  haptic?: HapticKind;
}

const HEIGHT: Record<Size, number> = { xl: 76, large: 60, small: 48 };
const FONT: Record<Size, number> = { xl: 24, large: 18, small: 15 };

export function StickerButton({
  label,
  onPress,
  onLongPress,
  variant = 'primary',
  size = 'large',
  icon,
  disabled,
  style,
  accessibilityLabel,
  testID,
  haptic,
}: Props) {
  const big = size !== 'small';
  const offset = big ? 4 : 2;
  const ghost = variant === 'ghost';
  const flat = ghost || disabled;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={() => {
        buzz(haptic ?? (variant === 'primary' ? 'medium' : 'light'));
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: HEIGHT[size],
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: radius.pill,
          borderWidth: ghost ? 0 : big ? border.strong : border.base,
          borderColor: colors.ink,
          backgroundColor: ghost ? 'transparent' : variant === 'primary' ? colors.coral : colors.card,
          opacity: disabled ? 0.45 : 1,
          // Appuyé, le bouton « s'enfonce » sur son ombre
          ...(flat || pressed ? {} : hardShadow(offset)),
          transform: pressed && !flat ? [{ translateX: offset }, { translateY: offset }] : [],
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text
        weight={ghost ? 'bold' : 'titleMedium'}
        size={FONT[size]}
        color={ghost ? colors.inkMuted : text.button.color}
        style={ghost ? { textDecorationLine: 'underline' } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
