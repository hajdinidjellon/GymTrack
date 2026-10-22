import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SPRING_SOFT = { damping: 15, stiffness: 150 };

/** Below this, the sequence is cut short: the app never waits for the animation. */
const MIN_VISIBLE_MS = 1000;
const EXIT_MS = 260;

// Hauteur des disques, du plus lourd (contre la butée) au plus léger
const PLATES = [100, 84, 62];
const PLATE_WIDTH = 14;
const PLATE_GAP = 3;
const BAR_WIDTH = 250;
const LEFT_COLLAR = 80;
const RIGHT_COLLAR = BAR_WIDTH - LEFT_COLLAR;

interface Props {
  /** Data and fonts are loaded: the animation may leave once it has played. */
  ready: boolean;
  onDone: () => void;
}

/**
 * Cold start only. The bar draws itself, plates slide on from each side,
 * the name appears, then everything fades into the first screen.
 * Reduce Motion: no movement, just a fade.
 */
export function LaunchAnimation({ ready, onDone }: Props) {
  const reduced = useReducedMotion();
  const [played, setPlayed] = useState(false);

  const bar = useSharedValue(reduced ? 1 : 0);
  const plates = [useSharedValue(reduced ? 1 : 0), useSharedValue(reduced ? 1 : 0), useSharedValue(reduced ? 1 : 0)];
  const word = useSharedValue(reduced ? 1 : 0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!reduced) {
      bar.value = withTiming(1, { duration: 320, easing: EASE_OUT });
      plates.forEach((p, i) => {
        p.value = withDelay(200 + i * 80, withSpring(1, SPRING_SOFT));
      });
      word.value = withDelay(520, withTiming(1, { duration: 320, easing: EASE_OUT }));
    }
    const timer = setTimeout(() => setPlayed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
    // Joué une seule fois, au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !played) return;
    exit.value = withTiming(1, { duration: EXIT_MS, easing: Easing.bezier(0.4, 0, 1, 1) });
    const timer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(timer);
  }, [ready, played, exit, onDone]);

  const overlay = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const content = useAnimatedStyle(() => ({ transform: [{ scale: 1 + exit.value * 0.04 }] }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.value }] }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 12 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel="GymTrack, chargement"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
        overlay,
      ]}
    >
      <Animated.View style={[{ alignItems: 'center' }, content]}>
        <View style={{ width: BAR_WIDTH, height: 110 }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 51,
                left: 0,
                width: BAR_WIDTH,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.steel,
              },
              barStyle,
            ]}
          />
          {PLATES.map((height, i) => (
            <React.Fragment key={height}>
              <Plate
                progress={plates[i]!}
                side={-1}
                height={height}
                x={LEFT_COLLAR - (i + 1) * (PLATE_WIDTH + PLATE_GAP)}
              />
              <Plate
                progress={plates[i]!}
                side={1}
                height={height}
                x={RIGHT_COLLAR + PLATE_GAP + i * (PLATE_WIDTH + PLATE_GAP)}
              />
            </React.Fragment>
          ))}
        </View>
        <Animated.View style={[{ marginTop: 22 }, wordStyle]}>
          <Text size={34} weight="black">
            GymTrack
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

function Plate({
  progress,
  side,
  height,
  x,
}: {
  progress: SharedValue<number>;
  side: 1 | -1;
  height: number;
  x: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.5),
    transform: [{ translateX: (1 - progress.value) * side * 44 }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: 55 - height / 2,
          width: PLATE_WIDTH,
          height,
          borderRadius: 4,
          backgroundColor: colors.cream,
        },
        style,
      ]}
    />
  );
}
