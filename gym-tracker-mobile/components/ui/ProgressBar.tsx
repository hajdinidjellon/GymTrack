import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  color?: string;
  gradient?: [string, string];
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = '#7c3aed',
  gradient,
  backgroundColor = 'rgba(255,255,255,0.08)',
  height = 6,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = Math.min(Math.max(progress, 0), 100);
    if (animated) {
      Animated.spring(width, { toValue: target, useNativeDriver: false, speed: 12 }).start();
    } else {
      width.setValue(target);
    }
  }, [progress, animated, width]);

  const animatedWidth = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="gap-1">
      {(showLabel || label) && (
        <View className="flex-row justify-between items-center">
          {label && <Text className="text-xs text-text-secondary">{label}</Text>}
          {showLabel && (
            <Text className="text-xs font-semibold text-text-primary">
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          backgroundColor,
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={{ width: animatedWidth, height }}>
          {gradient ? (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: height / 2 }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                borderRadius: height / 2,
                backgroundColor: color,
              }}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#7c3aed',
  backgroundColor = 'rgba(255,255,255,0.08)',
  children,
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: clampedProgress > 0 ? color : 'transparent',
          transform: [{ rotate: `${(clampedProgress / 100) * 360 - 90}deg` }],
        }}
      />
      {children && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      )}
    </View>
  );
}
