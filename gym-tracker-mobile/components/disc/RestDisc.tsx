import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

interface Props {
  secondsLeft: number;
  total: number;
  size?: number;
}

/** The rest timer is a plate: its rim empties as the rest runs out. */
export function RestDisc({ secondsLeft, total, size = 300 }: Props) {
  const stroke = 19;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? Math.min(1, secondsLeft / total) : 0;
  const inner = size - stroke * 2 - 0;
  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`Repos, ${secondsLeft} secondes restantes`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.cream}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </Svg>
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size={16} weight="black" color={colors.muted} style={{ position: 'absolute', top: 30, letterSpacing: 3 }}>
          REPOS
        </Text>
        <Text size={92} weight="black" style={{ lineHeight: 100 }}>
          {clock}
        </Text>
        <View
          style={{
            position: 'absolute',
            bottom: 34,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.bg,
            borderWidth: 3,
            borderColor: colors.line,
          }}
        />
      </View>
    </View>
  );
}
