// =============================================================
// RankCore.tsx
// Central HUD core — segmented XP ring + silver rank badge image
// + soft pulsing outer glow.
//
// Props:
//   shieldSource   image source (require(...) or { uri })
//   progress       0-100, drives the XpRing
//   size           overall component size (default 150)
//   shieldScale    badge size as a fraction of `size` (default 0.46)
//   accent         cyan accent (default '#00C8FF')
//   pulse          enable idle outer-glow pulse (default true)
//   animated       pass-through to XpRing (default true)
// =============================================================

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { XpRing } from './XpRing';

export interface RankCoreProps {
  shieldSource: any;
  progress: number;
  size?: number;
  shieldScale?: number;
  accent?: string;
  pulse?: boolean;
  animated?: boolean;
}

export function RankCore({
  shieldSource,
  progress,
  size = 150,
  shieldScale = 0.46,
  accent = '#00C8FF',
  pulse = true,
  animated = true,
}: RankCoreProps) {
  const p = useSharedValue(0.7);

  React.useEffect(() => {
    if (!pulse) {
      p.value = 0.7;
      return;
    }
    p.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse, p]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.96 + (p.value - 0.7) * 0.25 }],
  }));

  const shieldSize = size * shieldScale;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
      ]}
    >
      {/* outer soft glow (animated pulse) */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: accent,
            opacity: 0.18,
            transform: [{ scale: 1.18 }],
          },
          { shadowColor: accent, shadowOpacity: 0.9, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
          glowStyle,
        ]}
      />

      {/* segmented XP ring */}
      <View style={StyleSheet.absoluteFill}>
        <XpRing
          progress={progress}
          size={size}
          segments={24}
          thickness={14}
          barWidth={5}
          inset={4}
          activeColor={accent}
          animated={animated}
        />
      </View>

      {/* shield badge */}
      <Image
        source={shieldSource}
        style={{
          width: shieldSize,
          height: shieldSize,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});

export default RankCore;
