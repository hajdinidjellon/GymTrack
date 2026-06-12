/**
 * STAT CELL — cellule de télémétrie : label HUD + valeur massive + unité.
 * Variante `live` : point cyan qui clignote à côté du label (donnée temps réel).
 */
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { hud, hudType } from '@/constants/theme';
import { HudCard } from './HudCard';
import { AnimatedNumber } from './AnimatedNumber';

export type StatCellProps = {
  label: string;
  value: number;
  decimals?: number;
  unit?: string;
  /** Couleur de la valeur (ex : hud.accent.ember pour le streak). */
  valueColor?: string;
  /** Point clignotant = donnée live. */
  live?: boolean;
  /** Compte depuis 0 à l'apparition. */
  countOnMount?: boolean;
  icon?: React.ReactNode;
};

function LiveDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: 5, height: 5, borderRadius: 3, backgroundColor: hud.cyan.primary },
        style,
      ]}
    />
  );
}

export function StatCell({
  label,
  value,
  decimals = 0,
  unit,
  valueColor = hud.text.primary,
  live = false,
  countOnMount = false,
  icon,
}: StatCellProps) {
  return (
    <HudCard level="g1" cut={hud.cut.sm} padding={12} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {live && <LiveDot />}
        <Text style={hudType.labelHud} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        {icon}
        <AnimatedNumber
          value={value}
          decimals={decimals}
          animateOnMount={countOnMount}
          duration={800}
          style={[hudType.displayStat, { color: valueColor }]}
        />
        {unit ? (
          <Text style={[hudType.labelHud, { color: hud.text.muted }]}>{unit}</Text>
        ) : null}
      </View>
    </HudCard>
  );
}
