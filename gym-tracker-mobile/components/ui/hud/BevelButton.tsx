/**
 * BEVEL BUTTON — bouton octogonal signature (DESIGN-GYMTRACK.md §A.6).
 *
 * primary : gradient bevel bleu (#2196F3 → #1050C0 → #061840) + glow G2,
 *           chevrons fantômes ››› en cascade à droite (animés si `heroChevrons`).
 * ghost   : transparent, bordure cyan 30 %.
 * danger  : transparent, bordure pulse.
 *
 * Press : scale 0.97 (spring) + haptic selection. Aucun tap muet.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  LinearGradient as SkLinearGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hud, hudType, motion } from '@/constants/theme';
import { octagonPath } from './octagon';

const HALO_PAD = 24;

export type BevelButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  /** Hauteur : 56 (primaire plein) ou 48 (secondaire). */
  height?: number;
  /** Chevrons ››› animés en boucle — réservé au CTA principal de l'écran. */
  heroChevrons?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  haptic?: boolean;
};

function GhostChevron({ index, animated }: { index: number; animated: boolean }) {
  const baseOpacity = [0.4, 0.25, 0.12][index] ?? 0.12;
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    if (!animated) {
      cancelAnimation(opacity);
      opacity.value = baseOpacity;
      return;
    }
    opacity.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(Math.min(1, baseOpacity + 0.5), { duration: 450 }),
          withTiming(baseOpacity, { duration: 1350 }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [animated]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text
      style={[
        { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: hud.cyan.bright, marginLeft: -3 },
        style,
      ]}
    >
      ›
    </Animated.Text>
  );
}

export function BevelButton({
  label,
  onPress,
  variant = 'primary',
  height = 56,
  heroChevrons = false,
  disabled = false,
  loading = false,
  icon,
  haptic = true,
}: BevelButtonProps) {
  const [width, setWidth] = useState(0);
  const scale = useSharedValue(1);
  const isPrimary = variant === 'primary';
  const cut = hud.cut.md;

  const path = useMemo(
    () => (width > 0 ? octagonPath(HALO_PAD, HALO_PAD, width, height, cut) : null),
    [width, height],
  );

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const borderColor =
    variant === 'danger' ? hud.accent.pulse
    : isPrimary ? hud.cyan.primary
    : 'rgba(29,196,255,0.30)';

  const labelColor =
    variant === 'danger' ? hud.accent.pulse
    : isPrimary ? hud.text.primary
    : hud.cyan.bright;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, motion.spring);
    if (haptic) Haptics.selectionAsync();
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring);
  };

  return (
    <Animated.View style={[{ opacity: disabled ? 0.4 : 1 }, pressStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{ height, justifyContent: 'center' }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {path && (
          <Canvas
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -HALO_PAD,
              left: -HALO_PAD,
              width: width + HALO_PAD * 2,
              height: height + HALO_PAD * 2,
            }}
          >
            {/* Glow G2 (primaire uniquement) */}
            {isPrimary && (
              <SkPath path={path} color={hud.glow.cyan} style="fill">
                <BlurMask blur={16} style="normal" />
              </SkPath>
            )}

            {/* Fond bevel */}
            {isPrimary && (
              <SkPath path={path} style="fill">
                <SkLinearGradient
                  start={vec(HALO_PAD + width / 2, HALO_PAD)}
                  end={vec(HALO_PAD + width / 2, HALO_PAD + height)}
                  colors={[...hud.gradient.bevelBtn]}
                  positions={[0, 0.55, 1]}
                />
              </SkPath>
            )}

            {/* Bordure */}
            <SkPath
              path={path}
              color={borderColor}
              style="stroke"
              strokeWidth={isPrimary ? 1.5 : 1}
            />
          </Canvas>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingHorizontal: 24,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={labelColor} />
          ) : (
            <>
              {icon}
              <Text style={[hudType.button, { color: labelColor }]}>{label}</Text>
              {isPrimary && (
                <View style={{ flexDirection: 'row', marginLeft: 2 }}>
                  {[0, 1, 2].map((i) => (
                    <GhostChevron key={i} index={i} animated={heroChevrons} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
