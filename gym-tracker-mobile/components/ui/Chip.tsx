import React from 'react';
import { View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Text } from './Text';

type Tone = 'neutral' | 'brass' | 'solid';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceHigh, fg: colors.cream },
  brass: { bg: colors.brassSoft, fg: colors.brass },
  solid: { bg: colors.cream, fg: colors.bg },
};

/** Small label: "+2,5 kg", "5 exercices", "3 sem." */
export function Chip({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: React.ReactNode }) {
  const { bg, fg } = tones[tone];
  return (
    <View
      style={{
        height: 28,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      <Text size={13} weight="black" color={fg}>
        {label}
      </Text>
    </View>
  );
}
