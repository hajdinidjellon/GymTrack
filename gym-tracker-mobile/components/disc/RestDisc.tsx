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
export function RestDisc({ secondsLeft, total, size = 264 }: Props) {
  const stroke = 16;
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
          stroke={colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
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
        <Text size={13} weight="black" color={colors.faint} style={{ position: 'absolute', top: 30, letterSpacing: 3 }}>
          REPOS
        </Text>
        <Text size={76} weight="black" style={{ lineHeight: 84 }}>
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
