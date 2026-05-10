import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  glowColor?: string;
}

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const;

export function Card({
  children,
  padding = 'md',
  className = '',
  style,
  ...rest
}: CardProps) {
  return (
    <View
      className={[
        'bg-white/[0.04] rounded-2xl border border-white/[0.08]',
        PADDING_CLASSES[padding],
        className,
      ].join(' ')}
      style={style}
      {...rest}
    >
      {children}
    </View>
  );
}
