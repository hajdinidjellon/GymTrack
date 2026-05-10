import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { colors } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#ef4444'
    : focused
      ? '#7c3aed'
      : 'rgba(255,255,255,0.12)';

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-text-secondary">{label}</Text>
      )}

      <View
        className="flex-row items-center rounded-xl bg-white/[0.06] px-3 gap-2"
        style={{ borderWidth: 1, borderColor }}
      >
        {leftIcon && <View className="opacity-60">{leftIcon}</View>}

        <TextInput
          className="flex-1 py-3 text-base text-text-primary"
          placeholderTextColor={colors.text.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.brand.primary}
          {...rest}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <View className="opacity-60">{rightIcon}</View>
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-xs text-status-danger">{error}</Text>
      )}
      {hint && !error && (
        <Text className="text-xs text-text-muted">{hint}</Text>
      )}
    </View>
  );
}

// Variante numérique compacte pour les séries (poids/reps)
interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export function NumericInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
}: NumericInputProps) {
  const handleChange = (text: string) => {
    const num = parseFloat(text.replace(',', '.'));
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    } else if (text === '' || text === '-') {
      onChange(min);
    }
  };

  return (
    <View className="flex-row items-center bg-white/[0.08] rounded-lg px-2 py-1.5 gap-1">
      <TextInput
        className="text-base font-semibold text-text-primary text-center min-w-[48px]"
        value={String(value)}
        onChangeText={handleChange}
        keyboardType="numeric"
        selectTextOnFocus
        placeholderTextColor={colors.text.muted}
      />
      {suffix && (
        <Text className="text-sm text-text-muted">{suffix}</Text>
      )}
    </View>
  );
}
