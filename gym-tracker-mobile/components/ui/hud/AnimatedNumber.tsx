/**
 * ANIMATED NUMBER — compteur animé (DESIGN-GYMTRACK.md §A.7).
 * Toute valeur qui change compte de l'ancienne vers la nouvelle valeur
 * (ease-out), en tabular-nums pour éviter le jitter horizontal.
 *
 * Implémentation : TextInput non-éditable piloté par useAnimatedProps —
 * la valeur défile sur le thread UI sans re-render React.
 */
import React, { useEffect, useRef } from 'react';
import { TextInput, type TextStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: StyleProp<TextStyle>;
  /** Si false, la première valeur s'affiche sans compter. */
  animateOnMount?: boolean;
};

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 600,
  style,
  animateOnMount = false,
}: AnimatedNumberProps) {
  const isFirst = useRef(true);
  const sv = useSharedValue(animateOnMount ? 0 : value);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      if (!animateOnMount) {
        sv.value = value;
        return;
      }
    }
    sv.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const txt = `${prefix}${sv.value.toFixed(decimals)}${suffix}`;
    return { text: txt, defaultValue: txt } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      animatedProps={animatedProps}
      style={[{ fontVariant: ['tabular-nums'], padding: 0 }, style]}
    />
  );
}
