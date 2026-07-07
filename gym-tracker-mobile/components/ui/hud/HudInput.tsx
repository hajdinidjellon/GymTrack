/**
 * HUD INPUT — champ de saisie « puits » (surfaceDeep, biseau cut.sm).
 * Focus  : bordure G2 + haptic selection.
 * Erreur : bordure pulse + shake 3×4px (250ms) + haptic error.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { Canvas, Path as SkPath, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hud, hudType } from '@/constants/theme';
import { octagonPath } from './octagon';

const PAD = 20;

export type HudInputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  height?: number;
  /** Style numérique géant pour la saisie de PRs (onboarding). */
  big?: boolean;
  /** Slot à droite du champ (ex : œil de visibilité du mot de passe). */
  right?: React.ReactNode;
};

export function HudInput({ label, error, height = 52, big = false, right, onFocus, onBlur, ...rest }: HudInputProps) {
  const [w, setW] = useState(0);
  const [focused, setFocused] = useState(false);
  const shakeX = useSharedValue(0);

  const inputHeight = big ? 72 : height;
  const path = useMemo(
    () => (w > 0 ? octagonPath(PAD, PAD, w, inputHeight, hud.cut.sm) : null),
    [w, inputHeight],
  );

  useEffect(() => {
    if (!error) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeX.value = withSequence(
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 80 }),
      withTiming(-4, { duration: 80 }),
      withTiming(0, { duration: 50 }),
    );
  }, [error]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const borderColor = error ? hud.accent.pulse : focused ? hud.cyan.primary : hud.border.hairline;
  const glowColor = error ? hud.accent.pulseDim : hud.glow.cyan;
  const showGlow = focused || !!error;

  return (
    <Animated.View style={shakeStyle}>
      {label ? (
        <Text style={[hudType.labelHud, { marginBottom: 6, color: focused ? hud.cyan.bright : hud.text.secondary }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={{ height: inputHeight, justifyContent: 'center' }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {path && (
          <Canvas
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -PAD,
              left: -PAD,
              width: w + PAD * 2,
              height: inputHeight + PAD * 2,
            }}
          >
            {showGlow && (
              <SkPath path={path} color={glowColor} style="fill">
                <BlurMask blur={14} style="normal" />
              </SkPath>
            )}
            <SkPath path={path} color={hud.bg.surfaceDeep} style="fill" />
            <SkPath path={path} color={borderColor} style="stroke" strokeWidth={focused || error ? 1.5 : 1} />
          </Canvas>
        )}

        <TextInput
          placeholderTextColor={hud.text.faint}
          selectionColor={hud.cyan.primary}
          onFocus={(e) => {
            setFocused(true);
            Haptics.selectionAsync();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            paddingHorizontal: 16,
            paddingRight: right ? 44 : 16,
            color: hud.text.primary,
            fontFamily: big ? 'Rajdhani-Bold' : 'Rajdhani-Medium',
            fontSize: big ? 34 : 16,
            textAlign: big ? 'center' : 'left',
            height: inputHeight,
            ...(big ? { fontVariant: ['tabular-nums'] as ('tabular-nums')[] } : null),
          }}
          {...rest}
        />

        {right ? (
          <View style={{ position: 'absolute', right: 12, height: inputHeight, justifyContent: 'center' }}>
            {right}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: hud.accent.pulse, fontSize: 13, marginTop: 6 }}>{error}</Text>
      ) : null}
    </Animated.View>
  );
}
