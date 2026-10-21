import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';

/** One plate per planned session this week, filled once done. */
export function WeekDiscs({ done, planned }: { done: number; planned: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${done} séance${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''} sur ${planned}`}
      style={{ flexDirection: 'row', gap: 10 }}
    >
      {Array.from({ length: Math.max(planned, done) }, (_, i) => {
        const on = i < done;
        return (
          <View
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.cream : colors.bg,
              borderWidth: on ? 0 : 3,
              borderColor: colors.line,
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg }} />
          </View>
        );
      })}
    </View>
  );
}
