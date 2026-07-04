/**
 * SEGMENTED HUD — onglets en pills jointives, indicateur glissant (spring)
 * avec traînée de glow. Haptic selection à chaque changement.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Canvas, Path as SkPath, BlurMask } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { hud, motion } from '@/constants/theme';
import { octagonPath } from './octagon';

export type SegmentedHudProps = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  height?: number;
};

const PAD = 14;

export function SegmentedHud({ options, selectedIndex, onChange, height = 38 }: SegmentedHudProps) {
  const [w, setW] = useState(0);
  const n = options.length;
  const segW = n > 0 ? w / n : 0;
  const tx = useSharedValue(0);

  useEffect(() => {
    tx.value = withSpring(selectedIndex * segW, motion.spring);
  }, [selectedIndex, segW]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const indicatorPath =
    segW > 0 ? octagonPath(PAD, PAD, segW, height, hud.cut.sm) : null;

  return (
    <View
      style={{
        height,
        flexDirection: 'row',
        backgroundColor: hud.bg.surfaceDeep,
        borderWidth: 1,
        borderColor: hud.border.hairline,
        borderRadius: 4,
      }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {/* Indicateur glissant */}
      {indicatorPath && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, left: 0, width: segW, height }, indicatorStyle]}
        >
          <Canvas
            style={{
              position: 'absolute',
              top: -PAD,
              left: -PAD,
              width: segW + PAD * 2,
              height: height + PAD * 2,
            }}
          >
            <SkPath path={indicatorPath} color={hud.glow.cyan} style="fill">
              <BlurMask blur={10} style="normal" />
            </SkPath>
            <SkPath path={indicatorPath} color={hud.bg.surfaceElev} style="fill" />
            <SkPath path={indicatorPath} color={hud.cyan.primary} style="stroke" strokeWidth={1.2} />
          </Canvas>
        </Animated.View>
      )}

      {options.map((opt, i) => {
        const active = i === selectedIndex;
        return (
          <Pressable
            key={opt}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => {
              if (i === selectedIndex) return;
              Haptics.selectionAsync();
              onChange(i);
            }}
          >
            <Text
              style={{
                fontFamily: active ? 'Rajdhani-Bold' : 'Rajdhani-Medium',
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: active ? hud.cyan.bright : hud.text.muted,
              }}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
