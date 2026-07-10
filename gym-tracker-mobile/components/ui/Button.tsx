import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Animated,
  type TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Variant = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  pill?: boolean;
  label: string;
}

const SIZE_PADDING: Record<Size, { px: number; py: number }> = {
  sm: { px: 14, py: 8 },
  md: { px: 20, py: 13 },
  lg: { px: 24, py: 16 },
};

const LABEL_SIZE: Record<Size, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  pill = false,
  label,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;
  const { px, py } = SIZE_PADDING[size];
  const fontSize = LABEL_SIZE[size];
  const borderRadius = pill ? 999 : size === 'sm' ? 10 : size === 'md' ? 14 : 18;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: px,
        paddingVertical: py,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View>{icon}</View>}
          <Text
            style={{
              fontSize,
              fontWeight: '700',
              color: variant === 'secondary' ? 'rgba(248,250,252,0.9)' : variant === 'ghost' ? 'rgba(248,250,252,0.55)' : '#fff',
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View>{icon}</View>}
        </>
      )}
    </View>
  );

  const getBackground = () => {
    switch (variant) {
      case 'secondary':
        return (
          <View
            style={{
              borderRadius,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            {content}
          </View>
        );
      case 'ghost':
        return (
          <View style={{ borderRadius, overflow: 'hidden' }}>{content}</View>
        );
      case 'danger':
        return (
          <View
            style={{
              borderRadius,
              backgroundColor: '#ef4444',
              overflow: 'hidden',
            }}
          >
            {content}
          </View>
        );
      case 'success':
        return (
          <View
            style={{
              borderRadius,
              backgroundColor: '#10b981',
              overflow: 'hidden',
            }}
          >
            {content}
          </View>
        );
      case 'gradient':
        return (
          <LinearGradient
            colors={['#7c3aed', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius,
              overflow: 'hidden',
              shadowColor: '#7c3aed',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            {content}
          </LinearGradient>
        );
      default: // primary
        return (
          <View
            style={{
              borderRadius,
              backgroundColor: '#7c3aed',
              overflow: 'hidden',
              shadowColor: '#7c3aed',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {content}
          </View>
        );
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        opacity: isDisabled ? 0.4 : 1,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...rest}
      >
        {getBackground()}
      </TouchableOpacity>
    </Animated.View>
  );
}
