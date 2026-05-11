import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  glowColor?: string;
}

const PADDING: Record<NonNullable<CardProps['padding']>, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

export function Card({
  children,
  padding = 'md',
  className = '',
  style,
  glow,
  glowColor = '#7c3aed',
  ...rest
}: CardProps) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          padding: PADDING[padding],
          shadowColor: glow ? glowColor : '#000',
          shadowOffset: { width: 0, height: glow ? 0 : 4 },
          shadowOpacity: glow ? 0.5 : 0.25,
          shadowRadius: glow ? 20 : 8,
          elevation: glow ? 10 : 4,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
