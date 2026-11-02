import React from 'react';
import { View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { Text } from './Text';

type Tone = 'neutral' | 'sun' | 'success';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.card, fg: colors.ink },
  sun: { bg: colors.sun, fg: colors.ink },
  success: { bg: colors.successSoft, fg: colors.successText },
};

/** Small badge: "+2,5 kg", "5 exercices", "3 sem." */
export function Chip({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: React.ReactNode }) {
  const { bg, fg } = tones[tone];
  return (
    <View
      style={{
        height: 28,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: colors.ink,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      <Text size={13} weight="bold" color={fg}>
        {label}
      </Text>
    </View>
  );
}

/** Round mark for a list position: the number of an exercise in the session. */
export function IndexBadge({ value }: { value: number }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: border.base - 0.5,
        borderColor: colors.ink,
        backgroundColor: colors.sunSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={14} weight="black">
        {value}
      </Text>
    </View>
  );
}
