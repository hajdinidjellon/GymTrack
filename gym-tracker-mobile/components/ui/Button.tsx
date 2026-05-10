import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Animated,
  type TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  label: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-brand-primary',
  secondary: 'bg-white/10 border border-white/15',
  ghost:     'bg-transparent',
  danger:    'bg-status-danger',
  success:   'bg-status-success',
};

const LABEL_CLASSES: Record<Variant, string> = {
  primary:   'text-white font-semibold',
  secondary: 'text-text-primary font-medium',
  ghost:     'text-text-secondary font-medium',
  danger:    'text-white font-semibold',
  success:   'text-white font-semibold',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-2xl',
};

const LABEL_SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  label,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: fullWidth ? 'stretch' : 'flex-start' }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        className={[
          'flex-row items-center justify-center gap-2',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          isDisabled ? 'opacity-40' : '',
        ].join(' ')}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <View>{icon}</View>}
            <Text className={[LABEL_CLASSES[variant], LABEL_SIZE_CLASSES[size]].join(' ')}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && <View>{icon}</View>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
